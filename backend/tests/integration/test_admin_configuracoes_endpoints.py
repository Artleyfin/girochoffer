"""
Testes de endpoint do módulo de administração: Configurações
(routes/admin_configuracoes_routes.py).

Cobre caminhos felizes e tristes de:
    GET  /api/admin/configuracoes
    PUT  /api/admin/configuracoes

Todos os endpoints exigem perfil ADMIN (@requer_autenticacao([Perfil.ADMIN.value])).

Contrato (ver CLAUDE.md):
    - Sucesso: recurso puro com status correto (200) ou schema de saída.
    - Erro: {detail, type, errors} via util/exception_handlers.py.
    - Mutações exigem header X-CSRF-Token (senão 403, type="forbidden").
    - Sessão por cookie; @requer_autenticacao() → 401 sem sessão; perfil errado → 403.

Notas de isolamento:
    - A tabela `configuracao` é LIMPA pelo conftest entre testes (fica vazia).
      Por isso, semeamos configs via configuracao_repo antes de exercer GET/PUT.
"""
import pytest
from fastapi import status


pytestmark = [pytest.mark.integration]


def _csrf(client):
    """Obtém um token CSRF válido para a sessão do cliente."""
    return client.get("/api/csrf-token").json()["token"]


# =============================================================================
# Fixtures de isolamento / seed
# =============================================================================

@pytest.fixture
def semear_configs():
    """
    Retorna função que insere configurações no banco (tabela limpa pelo conftest).

    Cada item: (chave, valor, descricao). A categoria sai do prefixo
    "[Categoria]" da descrição (senão "Outras").
    """
    from repo import configuracao_repo

    def _semear(itens):
        for chave, valor, descricao in itens:
            configuracao_repo.inserir_ou_atualizar(chave, valor, descricao)

    return _semear


# =============================================================================
# GET /api/admin/configuracoes
# =============================================================================

class TestListarConfiguracoes:
    def test_lista_agrupada_por_categoria(self, admin_autenticado, semear_configs):
        # A app pode semear configs no startup; usamos chaves próprias e
        # uma categoria singular ("CatTesteXYZ") para asserts determinísticos.
        semear_configs([
            ("config_teste_xyz_app", "Meu Sistema", "[CatTesteXYZ] Nome teste"),
            ("config_teste_xyz_cor", "#1a73e8", "[CatTesteXYZ] Cor teste"),
        ])
        resp = admin_autenticado.get("/api/admin/configuracoes")
        assert resp.status_code == status.HTTP_200_OK
        corpo = resp.json()
        assert isinstance(corpo["categorias"], list)
        # total deve contar todas as configs (inclui nossas 2 + seed da app)
        assert corpo["total"] == sum(len(c["itens"]) for c in corpo["categorias"])
        assert corpo["total"] >= 2

        # Mapa categoria -> itens
        cats = {c["categoria"]: c["itens"] for c in corpo["categorias"]}
        assert "CatTesteXYZ" in cats
        itens_cat = cats["CatTesteXYZ"]
        assert len(itens_cat) == 2

        # Shape do item
        item = itens_cat[0]
        assert {"chave", "valor", "descricao", "categoria"} <= set(item.keys())
        assert item["categoria"] == "CatTesteXYZ"

        por_chave = {i["chave"]: i for i in itens_cat}
        assert por_chave["config_teste_xyz_app"]["valor"] == "Meu Sistema"

    def test_categoria_outras_para_sem_prefixo(self, admin_autenticado, semear_configs):
        """Config com descrição sem '[Categoria]' cai em 'Outras'."""
        semear_configs([
            ("config_sem_categoria_xyz", "valor", "Descrição sem prefixo"),
        ])
        resp = admin_autenticado.get("/api/admin/configuracoes")
        assert resp.status_code == status.HTTP_200_OK
        cats = {c["categoria"]: c["itens"] for c in resp.json()["categorias"]}
        assert "Outras" in cats
        chaves_outras = {i["chave"] for i in cats["Outras"]}
        assert "config_sem_categoria_xyz" in chaves_outras

    def test_sem_sessao_401(self, client):
        resp = client.get("/api/admin/configuracoes")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["type"] == "unauthorized"

    def test_perfil_nao_admin_403(self, cliente_autenticado):
        resp = cliente_autenticado.get("/api/admin/configuracoes")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert resp.json()["type"] == "forbidden"

    def test_vendedor_403(self, vendedor_autenticado):
        resp = vendedor_autenticado.get("/api/admin/configuracoes")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert resp.json()["type"] == "forbidden"


# =============================================================================
# PUT /api/admin/configuracoes
# =============================================================================

class TestSalvarConfiguracoes:
    def test_atualiza_multiplas_sucesso(self, admin_autenticado, semear_configs):
        semear_configs([
            ("app_name", "Antigo", "Nome da aplicação"),
            ("resend_from_name", "Antigo Remetente", "Nome remetente"),
        ])
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "Novo Nome", "resend_from_name": "Novo Remetente"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_200_OK
        corpo = resp.json()
        assert corpo["atualizadas"] == 2
        assert corpo["chaves_nao_encontradas"] == []
        assert "2 configurações atualizadas" in corpo["message"]

        # Persistiu de fato
        from repo import configuracao_repo
        config_persistida = configuracao_repo.obter_por_chave("app_name")
        assert config_persistida is not None
        assert config_persistida.valor == "Novo Nome"

    def test_chave_nao_encontrada_mensagem_parcial(self, admin_autenticado, semear_configs):
        """Chave existente é atualizada; chave inexistente vira não-encontrada."""
        semear_configs([("app_name", "Antigo", "Nome da aplicação")])
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "Novo", "chave_inexistente": "x"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_200_OK
        corpo = resp.json()
        assert corpo["atualizadas"] == 1
        assert corpo["chaves_nao_encontradas"] == ["chave_inexistente"]
        assert "Chaves não encontradas: chave_inexistente" in corpo["message"]

    def test_nenhuma_atualizada_quando_todas_inexistentes(self, admin_autenticado):
        """Banco vazio: nenhuma chave existe, nada é atualizado."""
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"nao_existe": "valor"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_200_OK
        corpo = resp.json()
        assert corpo["atualizadas"] == 0
        assert corpo["chaves_nao_encontradas"] == ["nao_existe"]
        assert corpo["message"] == "Nenhuma configuração foi atualizada."

    def test_sem_sessao_401(self, client):
        token = _csrf(client)
        resp = client.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "X"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["type"] == "unauthorized"

    def test_perfil_nao_admin_403(self, cliente_autenticado):
        token = _csrf(cliente_autenticado)
        resp = cliente_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "X"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert resp.json()["type"] == "forbidden"

    def test_sem_csrf_403(self, admin_autenticado):
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "X"}},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert resp.json()["type"] == "forbidden"

    def test_configs_vazio_422(self, admin_autenticado):
        """O validador exige pelo menos uma configuração."""
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert resp.json()["type"] == "validation_error"

    def test_payload_sem_campo_configs_422(self, admin_autenticado):
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert resp.json()["type"] == "validation_error"

    def test_valor_max_invalido_422(self, admin_autenticado):
        """Chave terminando em _max com valor fora do range falha na validação do DTO."""
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"rate_limit_login_max": "99999"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert resp.json()["type"] == "validation_error"

    def test_email_invalido_422(self, admin_autenticado):
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"resend_from_email": "nao-eh-email"}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert resp.json()["type"] == "validation_error"

    def test_valor_vazio_422(self, admin_autenticado):
        token = _csrf(admin_autenticado)
        resp = admin_autenticado.put(
            "/api/admin/configuracoes",
            json={"configs": {"app_name": "   "}},
            headers={"X-CSRF-Token": token},
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert resp.json()["type"] == "validation_error"

    def test_excede_rate_limit_429(self, admin_autenticado, semear_configs,
                                   bloquear_rate_limiter):
        semear_configs([("app_name", "X", "Nome da aplicação")])
        token = _csrf(admin_autenticado)
        with bloquear_rate_limiter(
            "routes.admin_configuracoes_routes.admin_config_limiter"
        ):
            resp = admin_autenticado.put(
                "/api/admin/configuracoes",
                json={"configs": {"app_name": "Novo"}},
                headers={"X-CSRF-Token": token},
            )
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Retry-After" in resp.headers
