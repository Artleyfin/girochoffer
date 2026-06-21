"""
Testes para o modelo UsuarioLogado (model/usuario_logado_model.py)

Testa todos os métodos do dataclass UsuarioLogado incluindo
verificação de perfis, serialização e desserialização.
"""

import pytest
from unittest.mock import MagicMock

from model.usuario_logado_model import UsuarioLogado
from util.perfis import Perfil


class TestUsuarioLogadoInstanciacao:
    """Testes de criação de instâncias"""

    def test_criar_usuario_logado(self):
        """Deve criar instância com todos os campos"""
        usuario = UsuarioLogado(
            id=1,
            nome="João Silva",
            email="joao@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        assert usuario.id == 1
        assert usuario.nome == "João Silva"
        assert usuario.email == "joao@teste.com"
        assert usuario.perfil == "Empresa"

    def test_usuario_logado_imutavel(self):
        """UsuarioLogado deve ser imutável (frozen=True)"""
        usuario = UsuarioLogado(
            id=1,
            nome="João",
            email="joao@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        with pytest.raises(AttributeError):
            usuario.nome = "Novo Nome"


class TestIsAdmin:
    """Testes para o método is_admin()"""

    def test_admin_retorna_true(self):
        """Admin deve retornar True"""
        admin = UsuarioLogado(
            id=1,
            nome="Admin",
            email="admin@teste.com",
            perfil=Perfil.ADMIN.value
        )

        assert admin.is_admin() is True

    def test_empresa_retorna_false(self):
        """Empresa não deve ser admin"""
        empresa = UsuarioLogado(
            id=1,
            nome="Empresa Teste",
            email="empresa@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        assert empresa.is_admin() is False

    def test_motorista_retorna_false(self):
        """Motorista não deve ser admin"""
        motorista = UsuarioLogado(
            id=1,
            nome="Motorista Teste",
            email="motorista@teste.com",
            perfil=Perfil.MOTORISTA.value
        )

        assert motorista.is_admin() is False


class TestIsEmpresa:
    """Testes para o método is_empresa() (nome legado: is_cliente)"""

    def test_empresa_retorna_true(self):
        """Empresa deve retornar True"""
        empresa = UsuarioLogado(
            id=1,
            nome="Empresa Teste",
            email="empresa@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        assert empresa.is_empresa() is True

    def test_admin_retorna_false(self):
        """Admin não deve ser empresa"""
        admin = UsuarioLogado(
            id=1,
            nome="Admin",
            email="admin@teste.com",
            perfil=Perfil.ADMIN.value
        )

        assert admin.is_empresa() is False

    def test_motorista_retorna_false(self):
        """Motorista não deve ser empresa"""
        motorista = UsuarioLogado(
            id=1,
            nome="Motorista Teste",
            email="motorista@teste.com",
            perfil=Perfil.MOTORISTA.value
        )

        assert motorista.is_empresa() is False


class TestIsMotorista:
    """Testes para o método is_motorista() (nome legado: is_vendedor)"""

    def test_motorista_retorna_true(self):
        """Motorista deve retornar True"""
        motorista = UsuarioLogado(
            id=1,
            nome="Motorista Teste",
            email="motorista@teste.com",
            perfil=Perfil.MOTORISTA.value
        )

        assert motorista.is_motorista() is True

    def test_admin_retorna_false(self):
        """Admin não deve ser motorista"""
        admin = UsuarioLogado(
            id=1,
            nome="Admin",
            email="admin@teste.com",
            perfil=Perfil.ADMIN.value
        )

        assert admin.is_motorista() is False

    def test_empresa_retorna_false(self):
        """Empresa não deve ser motorista"""
        empresa = UsuarioLogado(
            id=1,
            nome="Empresa Teste",
            email="empresa@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        assert empresa.is_motorista() is False


class TestTemPerfil:
    """Testes para o método tem_perfil()"""

    def test_tem_perfil_unico(self):
        """Deve retornar True quando tem o perfil"""
        admin = UsuarioLogado(
            id=1,
            nome="Admin",
            email="admin@teste.com",
            perfil=Perfil.ADMIN.value
        )

        assert admin.tem_perfil(Perfil.ADMIN.value) is True

    def test_nao_tem_perfil(self):
        """Deve retornar False quando não tem o perfil"""
        empresa = UsuarioLogado(
            id=1,
            nome="Empresa Teste",
            email="empresa@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        assert empresa.tem_perfil(Perfil.ADMIN.value) is False

    def test_tem_perfil_multiplos(self):
        """Deve retornar True quando tem um dos perfis"""
        motorista = UsuarioLogado(
            id=1,
            nome="Motorista Teste",
            email="motorista@teste.com",
            perfil=Perfil.MOTORISTA.value
        )

        # Motorista está na lista
        assert motorista.tem_perfil(
            Perfil.ADMIN.value,
            Perfil.MOTORISTA.value
        ) is True

    def test_nao_tem_nenhum_perfil(self):
        """Deve retornar False quando não tem nenhum dos perfis"""
        empresa = UsuarioLogado(
            id=1,
            nome="Empresa Teste",
            email="empresa@teste.com",
            perfil=Perfil.EMPRESA.value
        )

        # Empresa não é admin nem motorista
        assert empresa.tem_perfil(
            Perfil.ADMIN.value,
            Perfil.MOTORISTA.value
        ) is False


class TestToDict:
    """Testes para o método to_dict()"""

    def test_converte_para_dict(self):
        """Deve converter para dicionário"""
        usuario = UsuarioLogado(
            id=42,
            nome="Teste",
            email="teste@email.com",
            perfil="Empresa"
        )

        resultado = usuario.to_dict()

        assert resultado == {
            "id": 42,
            "nome": "Teste",
            "email": "teste@email.com",
            "perfil": "Empresa"
        }


class TestFromDict:
    """Testes para o método from_dict()"""

    def test_cria_de_dict_completo(self):
        """Deve criar instância de dicionário completo"""
        dados = {
            "id": 1,
            "nome": "João",
            "email": "joao@email.com",
            "perfil": "Empresa"
        }

        usuario = UsuarioLogado.from_dict(dados)

        assert usuario is not None
        assert usuario.id == 1
        assert usuario.nome == "João"
        assert usuario.email == "joao@email.com"
        assert usuario.perfil == "Empresa"

    def test_retorna_none_para_none(self):
        """Deve retornar None quando data é None"""
        resultado = UsuarioLogado.from_dict(None)

        assert resultado is None

    def test_levanta_erro_campo_faltando(self):
        """Deve levantar ValueError quando campo está faltando"""
        dados_incompletos = {
            "id": 1,
            "nome": "João",
            # falta email e perfil
        }

        with pytest.raises(ValueError) as exc_info:
            UsuarioLogado.from_dict(dados_incompletos)

        assert "Campos obrigatórios ausentes" in str(exc_info.value)

    def test_levanta_erro_mostra_campos_faltantes(self):
        """Mensagem de erro deve mostrar quais campos faltam"""
        dados_incompletos = {
            "id": 1,
            "nome": "João",
            "email": "joao@email.com"
            # falta perfil
        }

        with pytest.raises(ValueError) as exc_info:
            UsuarioLogado.from_dict(dados_incompletos)

        assert "perfil" in str(exc_info.value)


class TestFromUsuario:
    """Testes para o método from_usuario()"""

    def test_cria_de_usuario(self):
        """Deve criar UsuarioLogado de objeto Usuario"""
        # Mock do objeto Usuario
        usuario_mock = MagicMock()
        usuario_mock.id = 123
        usuario_mock.nome = "Maria"
        usuario_mock.email = "maria@email.com"
        usuario_mock.perfil = "Motorista"

        usuario_logado = UsuarioLogado.from_usuario(usuario_mock)

        assert usuario_logado.id == 123
        assert usuario_logado.nome == "Maria"
        assert usuario_logado.email == "maria@email.com"
        assert usuario_logado.perfil == "Motorista"
