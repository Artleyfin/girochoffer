"""
Rotas do catálogo de referência (API JSON, público).

Expõe os tipos de veículo e carrocerias ativos para preenchimento de
selects no frontend (cadastro de motorista, publicação de cargas, filtros).

Endpoint público (sem autenticação) — apenas dados de referência, sem
informação sensível. Protegido por rate limit por IP.
"""

from fastapi import APIRouter, Request

from dtos.responses.catalogo_response import CatalogoResponse
from repo import catalogo_repo
from util.api_helpers import checar_rate_limit
from util.rate_limiter import DynamicRateLimiter

router = APIRouter(prefix="/catalogos")

catalogo_limiter = DynamicRateLimiter(
    chave_max="rate_limit_catalogo_max",
    chave_minutos="rate_limit_catalogo_minutos",
    padrao_max=120,
    padrao_minutos=1,
    nome="catalogo",
)


@router.get("", response_model=CatalogoResponse)
async def obter_catalogo(request: Request):
    """Retorna os tipos de veículo e carrocerias ativos (público)."""
    checar_rate_limit(catalogo_limiter, request)

    tipos_veiculo = catalogo_repo.obter_tipos_veiculo_ativos()
    carrocerias = catalogo_repo.obter_carrocerias_ativas()
    return CatalogoResponse.de_listas(tipos_veiculo, carrocerias)
