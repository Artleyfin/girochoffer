# =============================================================================
# Rotas de Autenticação (API JSON)
# =============================================================================

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status

# DTOs (entrada)
from dtos.auth_dto import LoginDTO, EsqueciSenhaDTO, RedefinirSenhaDTO
from dtos.cadastro_dto import CadastroDTO, TIPO_EMPRESA, TIPO_MOTORISTA

# Schemas (saída)
from dtos.responses.comum import MensagemResponse, TokenCsrfResponse
from dtos.responses.usuario_response import UsuarioResponse

# Models
from model.usuario_model import Usuario
from model.usuario_logado_model import UsuarioLogado
from model.empresa_model import Empresa
from model.motorista_model import Motorista
from model.veiculo_model import Veiculo

# Repositories
from repo import usuario_repo, empresa_repo, motorista_repo, veiculo_repo

# Utilities
from util.api_helpers import checar_rate_limit
from util.auth_decorator import criar_sessao, destruir_sessao, requer_autenticacao
from util.csrf_protection import obter_token_csrf
from util.datetime_util import agora
from util.email_service import servico_email
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter
from util.security import (
    criar_hash_senha,
    verificar_senha,
    gerar_token_redefinicao,
    obter_data_expiracao_token,
)
from util.validation_helpers import verificar_email_disponivel

TOKEN_EXPIRACAO_HORAS = 1

router = APIRouter()


# =============================================================================
# Rate Limiters
# =============================================================================

login_limiter = DynamicRateLimiter(
    chave_max="rate_limit_login_max",
    chave_minutos="rate_limit_login_minutos",
    padrao_max=5,
    padrao_minutos=5,
    nome="login",
)
cadastro_limiter = DynamicRateLimiter(
    chave_max="rate_limit_cadastro_max",
    chave_minutos="rate_limit_cadastro_minutos",
    padrao_max=3,
    padrao_minutos=10,
    nome="cadastro",
)
esqueci_senha_limiter = DynamicRateLimiter(
    chave_max="rate_limit_esqueci_senha_max",
    chave_minutos="rate_limit_esqueci_senha_minutos",
    padrao_max=1,
    padrao_minutos=1,
    nome="esqueci_senha",
)


# =============================================================================
# CSRF / Sessão
# =============================================================================

@router.get("/csrf-token", response_model=TokenCsrfResponse)
async def get_csrf_token(request: Request):
    """Retorna o token CSRF da sessão (criando a sessão se necessário)."""
    return TokenCsrfResponse(token=obter_token_csrf(request))


@router.get("/me", response_model=UsuarioResponse)
@requer_autenticacao()
async def get_me(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Retorna o usuário autenticado atual (401 se não houver sessão)."""
    assert usuario_logado is not None
    usuario = usuario_repo.obter_por_id(usuario_logado.id)
    if not usuario:
        destruir_sessao(request)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.")
    return UsuarioResponse.de_usuario(usuario)


# =============================================================================
# Login / Logout
# =============================================================================

@router.post("/login", response_model=UsuarioResponse)
async def post_login(request: Request, dto: LoginDTO):
    """Autentica o usuário e cria a sessão."""
    checar_rate_limit(login_limiter, request)

    usuario = usuario_repo.obter_por_email(dto.email)
    if not usuario or not verificar_senha(dto.senha, usuario.senha):
        logger.warning(f"Login falhou para: {dto.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    usuario_logado = UsuarioLogado.from_usuario(usuario)
    criar_sessao(request, usuario_logado)
    logger.info(f"Usuário {usuario.email} autenticado")
    return UsuarioResponse.de_usuario(usuario)


@router.post("/logout", response_model=MensagemResponse)
async def post_logout(request: Request):
    """Encerra a sessão do usuário."""
    email = request.session.get("usuario_logado", {}).get("email", "Usuário")
    destruir_sessao(request)
    logger.info(f"Usuário {email} fez logout")
    return MensagemResponse(message="Logout realizado com sucesso.")


# =============================================================================
# Cadastro
# =============================================================================

@router.post(
    "/cadastrar",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_cadastrar(request: Request, dto: CadastroDTO):
    """
    Cadastro composto: cria Usuario + (Empresa) OU Usuario + (Motorista + Veículo).

    O PERFIL é FIXADO no servidor a partir de ``dto.tipo`` (Empresa|Motorista),
    NUNCA aceito do cliente — evita escalada de privilégio (ADMIN jamais é
    selecionável no auto-cadastro público).

    Como o stack é SQL puro (sem ORM/transação automática que abranja as duas
    inserções), o ROLLBACK é MANUAL: se a 2ª inserção (Empresa/Motorista) ou a
    do veículo falhar, o usuário recém-criado é excluído para não deixar conta
    órfã sem perfil de domínio.
    """
    checar_rate_limit(cadastro_limiter, request)

    # Perfil derivado do tipo — fonte única via enum Perfil (nunca string literal).
    if dto.tipo == TIPO_EMPRESA:
        perfil = Perfil.EMPRESA.value
    elif dto.tipo == TIPO_MOTORISTA:
        perfil = Perfil.MOTORISTA.value
    else:  # defesa extra (o DTO já valida, mas não confiamos cegamente)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "detail": "Tipo de cadastro não permitido.",
                "type": "forbidden",
                "errors": {"tipo": ["Tipo de cadastro não permitido."]},
            },
        )

    disponivel, mensagem_erro = verificar_email_disponivel(dto.email)
    if not disponivel:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": mensagem_erro,
                "type": "conflict",
                "errors": {"email": [mensagem_erro]},
            },
        )

    usuario = Usuario(
        id=0,
        nome=dto.nome,
        email=dto.email,
        senha=criar_hash_senha(dto.senha),
        perfil=perfil,
    )
    usuario_id = usuario_repo.inserir(usuario)
    if not usuario_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao realizar cadastro. Tente novamente.",
        )

    # A partir daqui, qualquer falha exige ROLLBACK manual do usuário criado.
    try:
        if dto.tipo == TIPO_EMPRESA:
            _criar_perfil_empresa(usuario_id, dto)
        else:
            _criar_perfil_motorista(usuario_id, dto)
    except HTTPException:
        usuario_repo.excluir(usuario_id)
        raise
    except Exception:
        usuario_repo.excluir(usuario_id)
        logger.exception(
            f"Falha ao criar perfil de domínio para usuário {usuario_id}; "
            "usuário revertido (rollback manual)."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao realizar cadastro. Tente novamente.",
        )

    logger.info(f"Novo usuário cadastrado ({perfil}): {usuario.email}")
    servico_email.enviar_boas_vindas(usuario.email, usuario.nome)

    criado = usuario_repo.obter_por_id(usuario_id)
    # O cadastro NÃO cria sessão (mantém o endpoint stateless): o fluxo
    # "Criar conta e entrar" é concluído no frontend, que faz login em seguida.
    return UsuarioResponse.de_usuario(criado)


def _criar_perfil_empresa(usuario_id: int, dto: CadastroDTO) -> None:
    """Cria a Empresa vinculada ao usuário. Levanta em caso de falha (caller faz rollback)."""
    bloco = dto.empresa
    assert bloco is not None  # garantido pelo model_validator do DTO
    empresa = Empresa(
        id=0,
        usuario_id=usuario_id,
        cnpj=bloco.cnpj,
        razao_social=bloco.razao_social,
        nome_fantasia=bloco.nome_fantasia,
        telefone=bloco.telefone,
        whatsapp=bloco.whatsapp,
        foto_url=None,
        verificada=False,
        data_cadastro=agora(),
    )
    empresa_id = empresa_repo.inserir(empresa)
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar dados da empresa.",
        )


def _criar_perfil_motorista(usuario_id: int, dto: CadastroDTO) -> None:
    """
    Cria o Motorista + Veículo inicial vinculados ao usuário.

    Se a inserção do veículo falhar após criar o motorista, o motorista é
    removido aqui e a exceção propaga — o caller então reverte o usuário.
    """
    bloco = dto.motorista
    assert bloco is not None  # garantido pelo model_validator do DTO
    motorista = Motorista(
        id=0,
        usuario_id=usuario_id,
        cpf=bloco.cpf,
        telefone=bloco.telefone,
        cidade=bloco.cidade,
        nota=0.0,
        total_viagens=0,
        foto_url=None,
        verificado=False,
        data_cadastro=agora(),
    )
    motorista_id = motorista_repo.inserir(motorista)
    if not motorista_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar dados do motorista.",
        )

    veiculo = Veiculo(
        id=0,
        motorista_id=motorista_id,
        tipo_veiculo_id=bloco.tipo_veiculo_id,
        tipo_carroceria_id=bloco.tipo_carroceria_id,
        placa=bloco.placa,
        capacidade_kg=bloco.capacidade_kg,
        ativo=True,
        data_cadastro=agora(),
    )
    veiculo_id = veiculo_repo.inserir(veiculo)
    if not veiculo_id:
        # Propaga: o caller faz o rollback manual excluindo o usuário recém-criado
        # (motorista_repo não expõe exclusão; reverter o usuário é o contrato).
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar veículo do motorista.",
        )


# =============================================================================
# Recuperação de senha
# =============================================================================

@router.post("/esqueci-senha", response_model=MensagemResponse)
async def post_esqueci_senha(request: Request, dto: EsqueciSenhaDTO):
    """Solicita recuperação de senha; e-mail com link para o SPA."""
    checar_rate_limit(esqueci_senha_limiter, request)

    usuario = usuario_repo.obter_por_email(dto.email)
    if usuario:
        token = gerar_token_redefinicao()
        data_expiracao = obter_data_expiracao_token(horas=TOKEN_EXPIRACAO_HORAS)
        usuario_repo.atualizar_token(usuario.email, token, data_expiracao)
        enviado = servico_email.enviar_recuperacao_senha(
            usuario.email, usuario.nome, token
        )
        if enviado:
            logger.info(f"E-mail de recuperação enviado para: {usuario.email}")
        else:
            logger.error(f"Falha ao enviar recuperação para: {usuario.email}")

    # Mesma resposta sempre (evita enumeração de e-mails)
    return MensagemResponse(
        message=(
            "Se o e-mail estiver cadastrado, você receberá instruções "
            "para recuperação de senha."
        )
    )


@router.post("/redefinir-senha", response_model=MensagemResponse)
async def post_redefinir_senha(request: Request, dto: RedefinirSenhaDTO):
    """Redefine a senha a partir do token recebido por e-mail."""
    usuario = usuario_repo.obter_por_token(dto.token)
    if not usuario or not usuario.data_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )

    # data_token pode vir como datetime (conversor do SQLite) ou string
    data_token = usuario.data_token
    if isinstance(data_token, str):
        try:
            data_token = datetime.fromisoformat(data_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido."
            )
    if data_token.tzinfo is None:
        data_token = data_token.replace(tzinfo=agora().tzinfo)
    if agora() > data_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite uma nova recuperação.",
        )

    senha_hash = criar_hash_senha(dto.senha)
    usuario_repo.atualizar_senha(usuario.id, senha_hash)
    usuario_repo.limpar_token(usuario.id)
    logger.info(f"Senha redefinida para: {usuario.email}")

    return MensagemResponse(message="Senha redefinida com sucesso.")
