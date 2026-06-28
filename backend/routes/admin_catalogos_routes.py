# =============================================================================
# Rotas de Administração de Catálogos (API JSON) — CRUD admin-only
# Espelha admin_usuarios_routes.py: guarda Admin + rate limit.
# Cobre tipos de veículo e tipos de carroceria.
# =============================================================================

from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status

# DTOs (entrada)
from dtos.catalogo_dto import CatalogoItemDTO, AtualizarAtivoDTO

# Schemas (saída)
from dtos.responses.catalogo_response import (
    CatalogoAdminResponse,
    ItemCatalogoAdminResponse,
)

# Models
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import catalogo_repo

# Utilities
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/admin/catalogos")

# =============================================================================
# Rate Limiter
# =============================================================================

admin_catalogos_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_catalogos_max",
    chave_minutos="rate_limit_admin_catalogos_minutos",
    padrao_max=10,
    padrao_minutos=1,
    nome="admin_catalogos",
)

# =============================================================================
# Helpers — despacho por tipo de catálogo
# =============================================================================

TIPOS_VALIDOS = ("tipo_veiculo", "tipo_carroceria")


def _validar_tipo_catalogo(tipo: str) -> None:
    """Garante que o segmento da URL é um catálogo conhecido (404 se não for)."""
    if tipo not in TIPOS_VALIDOS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catálogo inexistente. Use 'tipo_veiculo' ou 'tipo_carroceria'.",
        )


def _obter_item_ou_404(tipo: str, id: int):
    """Carrega o item do catálogo certo ou lança 404."""
    if tipo == "tipo_veiculo":
        item = catalogo_repo.obter_tipo_veiculo(id)
    else:
        item = catalogo_repo.obter_carroceria(id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado."
        )
    return item


def _conflito_nome(mensagem_erro: str) -> HTTPException:
    """Monta a HTTPException 409 padronizada para nome já em uso."""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "detail": mensagem_erro,
            "type": "conflict",
            "errors": {"nome": [mensagem_erro]},
        },
    )


# =============================================================================
# Listagem (todos, ativos e inativos)
# =============================================================================

@router.get("", response_model=CatalogoAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def listar(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Lista TODOS os tipos de veículo e carrocerias (ativos e inativos)."""
    assert usuario_logado is not None

    tipos_veiculo = catalogo_repo.obter_todos_tipos_veiculo()
    carrocerias = catalogo_repo.obter_todas_carrocerias()
    return CatalogoAdminResponse.de_listas(tipos_veiculo, carrocerias)


# =============================================================================
# Criação
# =============================================================================

@router.post(
    "/{tipo}",
    response_model=ItemCatalogoAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao([Perfil.ADMIN.value])
async def criar(
    request: Request,
    tipo: str,
    dto: CatalogoItemDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cria um novo item no catálogo. Valida nome duplicado (409)."""
    assert usuario_logado is not None
    checar_rate_limit(admin_catalogos_limiter, request)
    _validar_tipo_catalogo(tipo)

    if tipo == "tipo_veiculo":
        if catalogo_repo.existe_nome_tipo_veiculo(dto.nome):
            raise _conflito_nome("Já existe um tipo de veículo com esse nome.")
        novo_id = catalogo_repo.inserir_tipo_veiculo(dto.nome, ativo=True)
    else:
        if catalogo_repo.existe_nome_carroceria(dto.nome):
            raise _conflito_nome("Já existe uma carroceria com esse nome.")
        novo_id = catalogo_repo.inserir_tipo_carroceria(dto.nome, ativo=True)

    if not novo_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar item do catálogo. Tente novamente.",
        )

    logger.info(f"Catálogo '{tipo}' item '{dto.nome}' criado por admin {usuario_logado.id}")
    item = _obter_item_ou_404(tipo, novo_id)
    return _para_response(tipo, item)


# =============================================================================
# Renomear (atualizar nome)
# =============================================================================

@router.put("/{tipo}/{id}", response_model=ItemCatalogoAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def renomear(
    request: Request,
    tipo: str,
    id: int,
    dto: CatalogoItemDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Renomeia um item do catálogo. Valida nome duplicado em outro id (409)."""
    assert usuario_logado is not None
    checar_rate_limit(admin_catalogos_limiter, request)
    _validar_tipo_catalogo(tipo)

    _obter_item_ou_404(tipo, id)  # 404 se não existir

    if tipo == "tipo_veiculo":
        if catalogo_repo.existe_nome_tipo_veiculo_outro_id(dto.nome, id):
            raise _conflito_nome("Já existe um tipo de veículo com esse nome.")
        ok = catalogo_repo.atualizar_tipo_veiculo(id, dto.nome)
    else:
        if catalogo_repo.existe_nome_carroceria_outro_id(dto.nome, id):
            raise _conflito_nome("Já existe uma carroceria com esse nome.")
        ok = catalogo_repo.atualizar_carroceria(id, dto.nome)

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao renomear item do catálogo. Tente novamente.",
        )

    logger.info(f"Catálogo '{tipo}' item {id} renomeado por admin {usuario_logado.id}")
    item = _obter_item_ou_404(tipo, id)
    return _para_response(tipo, item)


# =============================================================================
# Ativar/Desativar
# =============================================================================

@router.patch("/{tipo}/{id}/ativo", response_model=ItemCatalogoAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def alterar_ativo(
    request: Request,
    tipo: str,
    id: int,
    dto: AtualizarAtivoDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Ativa ou desativa um item do catálogo."""
    assert usuario_logado is not None
    checar_rate_limit(admin_catalogos_limiter, request)
    _validar_tipo_catalogo(tipo)

    _obter_item_ou_404(tipo, id)  # 404 se não existir

    if tipo == "tipo_veiculo":
        ok = catalogo_repo.atualizar_ativo_tipo_veiculo(id, dto.ativo)
    else:
        ok = catalogo_repo.atualizar_ativo_carroceria(id, dto.ativo)

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar status do item. Tente novamente.",
        )

    logger.info(
        f"Catálogo '{tipo}' item {id} ativo={dto.ativo} por admin {usuario_logado.id}"
    )
    item = _obter_item_ou_404(tipo, id)
    return _para_response(tipo, item)


# =============================================================================
# Helper de serialização (escolhe a factory certa do response)
# =============================================================================

def _para_response(tipo: str, item) -> ItemCatalogoAdminResponse:
    """Converte o model do tipo certo no response admin."""
    if tipo == "tipo_veiculo":
        return ItemCatalogoAdminResponse.de_tipo_veiculo(item)
    return ItemCatalogoAdminResponse.de_carroceria(item)
