# =============================================================================
# Rotas de Administração: Configurações (API JSON)
# =============================================================================

# Standard library
import sqlite3
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Request, status

# DTOs (entrada)
from dtos.configuracao_dto import SalvarConfiguracaoLoteDTO

# Schemas (saída)
from dtos.responses.config_response import (
    ConfigListaResponse,
    SalvarConfigResultadoResponse,
)

# Models
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import configuracao_repo

# Utilities
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.config_cache import config
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/admin")

# =============================================================================
# Rate Limiters
# =============================================================================

admin_config_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_config_max",
    chave_minutos="rate_limit_admin_config_minutos",
    padrao_max=10,
    padrao_minutos=1,
    nome="admin_config",
)


# =============================================================================
# Configurações do Sistema
# =============================================================================

@router.get("/configuracoes", response_model=ConfigListaResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def get_listar_configuracoes(
    request: Request, usuario_logado: Optional[UsuarioLogado] = None
):
    """Lista todas as configurações do sistema agrupadas por categoria."""
    assert usuario_logado is not None
    try:
        agrupado = configuracao_repo.obter_por_categoria()
    except sqlite3.Error as e:
        logger.error(f"Erro de banco de dados ao listar configurações: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar configurações.",
        )
    return ConfigListaResponse.de_agrupado(agrupado)


@router.put("/configuracoes", response_model=SalvarConfigResultadoResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def put_salvar_configuracoes(
    request: Request,
    dto: SalvarConfiguracaoLoteDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """
    Atualiza múltiplas configurações de uma vez (salvamento em lote).

    Após salvar, invalida o cache de configurações (aplicação imediata).
    A estilização de toast é responsabilidade do frontend no SPA.
    """
    assert usuario_logado is not None
    checar_rate_limit(admin_config_limiter, request)

    try:
        quantidade_atualizada, chaves_nao_encontradas = (
            configuracao_repo.atualizar_multiplas(dto.configs)
        )

        # Invalidar cache de configurações (alterações aplicadas imediatamente)
        config.limpar()

        logger.info(
            f"Atualização em lote de configurações por admin {usuario_logado.id} - "
            f"{quantidade_atualizada} atualizadas, "
            f"{len(chaves_nao_encontradas)} não encontradas"
        )
    except sqlite3.Error as e:
        logger.error(f"Erro de banco de dados ao salvar configurações em lote: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar configurações.",
        )

    if quantidade_atualizada > 0 and chaves_nao_encontradas:
        message = (
            f"{quantidade_atualizada} configurações atualizadas. "
            f"Chaves não encontradas: {', '.join(chaves_nao_encontradas)}."
        )
    elif quantidade_atualizada > 0:
        message = f"{quantidade_atualizada} configurações atualizadas com sucesso."
    else:
        message = "Nenhuma configuração foi atualizada."

    return SalvarConfigResultadoResponse(
        atualizadas=quantidade_atualizada,
        chaves_nao_encontradas=chaves_nao_encontradas,
        message=message,
    )
