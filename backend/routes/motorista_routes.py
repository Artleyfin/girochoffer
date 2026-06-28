"""
Rotas do perfil Motorista (API JSON) — GiroChoffer.

Permite que um motorista autenticado:
- Veja a vitrine de cargas disponíveis (com filtros origem/destino/carroceria).
- Veja o detalhe de uma carga, com flags de interesse e o contato da empresa
  liberado apenas quando o motorista já demonstrou interesse OU foi escolhido.
- Manifeste interesse por uma carga (idempotente; 409 se já existe).
- Liste suas cargas agrupadas (interesse enviado / contratadas / concluídas).
- Veja e edite o próprio perfil (dados pessoais + veículo principal).

Todas as rotas exigem perfil Motorista (``@requer_autenticacao([Perfil.MOTORISTA.value])``)
e resolvem o motorista logado via ``motorista_repo.obter_por_usuario_id``.
"""

# =============================================================================
# Imports
# =============================================================================

# Standard library
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

# Schemas (saída)
from dtos.motorista_dto import AtualizarMotoristaDTO
from dtos.responses.carga_response import CargaResumoResponse, CargaDetalheResponse
from dtos.responses.comum import MensagemResponse, PaginaResponse
from dtos.responses.motorista_response import MotoristaResponse
from dtos.responses.avaliacao_response import AvaliacaoResponse

# Models
from model.carga_model import StatusCarga
from model.motorista_model import Motorista
from model.usuario_logado_model import UsuarioLogado
from model.veiculo_model import Veiculo

# Repositories
from repo import (
    carga_repo,
    interesse_carga_repo,
    motorista_repo,
    veiculo_repo,
)
from repo import (
    carga_repo,
    interesse_carga_repo,
    motorista_repo,
    veiculo_repo,
    avaliacao_repo,
)

# Utilities
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.logger_config import logger
from util.paginacao_util import paginar
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/motorista")

# =============================================================================
# Rate Limiters
# =============================================================================

motorista_listar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_motorista_listar_max",
    chave_minutos="rate_limit_motorista_listar_minutos",
    padrao_max=120,
    padrao_minutos=1,
    nome="motorista_listar",
)
motorista_interesse_limiter = DynamicRateLimiter(
    chave_max="rate_limit_motorista_interesse_max",
    chave_minutos="rate_limit_motorista_interesse_minutos",
    padrao_max=30,
    padrao_minutos=10,
    nome="motorista_interesse",
)
motorista_perfil_limiter = DynamicRateLimiter(
    chave_max="rate_limit_motorista_perfil_max",
    chave_minutos="rate_limit_motorista_perfil_minutos",
    padrao_max=20,
    padrao_minutos=10,
    nome="motorista_perfil",
)
motorista_avaliacoes_limiter = DynamicRateLimiter(
    chave_max="rate_limit_motorista_avaliacoes_max",
    chave_minutos="rate_limit_motorista_avaliacoes_minutos",
    padrao_max=60,
    padrao_minutos=1,
    nome="motorista_avaliacoes",
)

# =============================================================================
# Schemas de saída específicos desta rota
# =============================================================================

class EmpresaContatoResponse(BaseModel):
    """Contato da empresa, liberado apenas quando o contato é permitido."""

    nome_fantasia: str
    telefone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None


class CargaMotoristaDetalheResponse(CargaDetalheResponse):
    """Detalhe de carga na visão do motorista, com flags e contato condicional."""

    ja_tenho_interesse: bool = False
    contato_liberado: bool = False
    empresa_contato: Optional[EmpresaContatoResponse] = None


class MinhasCargasResponse(BaseModel):
    """Cargas do motorista agrupadas por situação."""

    interesse_enviado: list[CargaResumoResponse]
    contratadas: list[CargaResumoResponse]
    concluidas: list[CargaResumoResponse]


# =============================================================================
# Helpers
# =============================================================================

def _obter_motorista_logado(usuario_logado: UsuarioLogado) -> Motorista:
    """Resolve o motorista vinculado ao usuário logado (404 se não houver)."""
    motorista = motorista_repo.obter_por_usuario_id(usuario_logado.id)
    if motorista is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de motorista não encontrado.",
        )
    return motorista


# =============================================================================
# Vitrine de cargas disponíveis
# =============================================================================

@router.get("/cargas", response_model=PaginaResponse[CargaResumoResponse])
@requer_autenticacao([Perfil.MOTORISTA.value])
async def listar_cargas(
    request: Request,
    origem: Optional[str] = None,
    destino: Optional[str] = None,
    carroceria_id: Optional[int] = None,
    pagina: int = 1,
    por_pagina: int = 10,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista as cargas Disponíveis, com filtros opcionais."""
    assert usuario_logado is not None
    checar_rate_limit(motorista_listar_limiter, request)
    _obter_motorista_logado(usuario_logado)

    cargas = carga_repo.obter_disponiveis(
        origem=origem,
        destino=destino,
        carroceria_id=carroceria_id,
    )
    paginacao = paginar(cargas, pagina, por_pagina)
    return PaginaResponse.de_paginacao(
        paginacao,
        [CargaResumoResponse.de_carga(c) for c in paginacao.items],
    )


# =============================================================================
# Detalhe de carga (visão do motorista)
# =============================================================================

@router.get("/cargas/{id}", response_model=CargaMotoristaDetalheResponse)
@requer_autenticacao([Perfil.MOTORISTA.value])
async def obter_carga(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Detalhe de uma carga com flags de interesse e contato condicional."""
    assert usuario_logado is not None
    motorista = _obter_motorista_logado(usuario_logado)

    carga = carga_repo.obter_por_id(id)
    if carga is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carga não encontrada.",
        )

    ja_tenho_interesse = interesse_carga_repo.existe(carga.id, motorista.id)
    foi_escolhido = carga.motorista_escolhido_id == motorista.id
    contato_liberado = ja_tenho_interesse or foi_escolhido

    empresa_contato: Optional[EmpresaContatoResponse] = None
    if contato_liberado:
        from repo import empresa_repo

        empresa = empresa_repo.obter_por_id(carga.empresa_id)
        if empresa is not None:
            empresa_contato = EmpresaContatoResponse(
                nome_fantasia=empresa.nome_fantasia,
                telefone=empresa.telefone,
                whatsapp=empresa.whatsapp,
                email=empresa.usuario_email,
            )

    # CargaDetalheResponse.de_carga preenche os campos da carga; as flags e o
    # contato são aplicados em seguida sobre o modelo já construído.
    detalhe = CargaMotoristaDetalheResponse.de_carga(carga, interessados=[])
    detalhe.ja_tenho_interesse = ja_tenho_interesse
    detalhe.contato_liberado = contato_liberado
    detalhe.empresa_contato = empresa_contato
    return detalhe


# =============================================================================
# Manifestar interesse
# =============================================================================

@router.post("/cargas/{id}/interesse", response_model=MensagemResponse)
@requer_autenticacao([Perfil.MOTORISTA.value])
async def manifestar_interesse(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Registra o interesse do motorista por uma carga (idempotente; 409 se já existe)."""
    assert usuario_logado is not None
    checar_rate_limit(motorista_interesse_limiter, request)
    motorista = _obter_motorista_logado(usuario_logado)

    carga = carga_repo.obter_por_id(id)
    if carga is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carga não encontrada.",
        )

    if carga.status != StatusCarga.DISPONIVEL:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta carga não está mais disponível.",
        )

    if interesse_carga_repo.existe(carga.id, motorista.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Você já demonstrou interesse nesta carga.",
        )

    interesse_id = interesse_carga_repo.inserir(carga.id, motorista.id)
    if not interesse_id:
        # Corrida: outro request inseriu entre o existe() e o inserir().
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Você já demonstrou interesse nesta carga.",
        )

    logger.info(
        f"Motorista {motorista.id} manifestou interesse na carga {carga.id}"
    )
    return MensagemResponse(message="Interesse registrado com sucesso.")


# =============================================================================
# Minhas cargas (agrupadas)
# =============================================================================

@router.get("/minhas", response_model=MinhasCargasResponse)
@requer_autenticacao([Perfil.MOTORISTA.value])
async def minhas_cargas(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cargas do motorista agrupadas: interesse enviado, contratadas, concluídas."""
    assert usuario_logado is not None
    motorista = _obter_motorista_logado(usuario_logado)

    cargas = interesse_carga_repo.obter_cargas_do_motorista(motorista.id)

    interesse_enviado: list[CargaResumoResponse] = []
    contratadas: list[CargaResumoResponse] = []
    concluidas: list[CargaResumoResponse] = []

    for carga in cargas:
        resumo = CargaResumoResponse.de_carga(carga)
        if carga.status == StatusCarga.CONCLUIDA:
            concluidas.append(resumo)
        elif (
            carga.status == StatusCarga.CONTRATADA
            and carga.motorista_escolhido_id == motorista.id
        ):
            contratadas.append(resumo)
        elif carga.status == StatusCarga.DISPONIVEL:
            interesse_enviado.append(resumo)

    return MinhasCargasResponse(
        interesse_enviado=interesse_enviado,
        contratadas=contratadas,
        concluidas=concluidas,
    )

# =============================================================================
# Avaliações recebidas
# =============================================================================

@router.get("/avaliacoes", response_model=list[AvaliacaoResponse])
@requer_autenticacao([Perfil.MOTORISTA.value])
async def listar_avaliacoes(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista as avaliações recebidas pelo motorista logado (mais recentes primeiro)."""
    assert usuario_logado is not None
    checar_rate_limit(motorista_avaliacoes_limiter, request)
    motorista = _obter_motorista_logado(usuario_logado)

    avaliacoes = avaliacao_repo.obter_por_motorista(motorista.id)
    return [AvaliacaoResponse.de_avaliacao(a) for a in avaliacoes]

# =============================================================================
# Perfil do motorista
# =============================================================================

@router.get("/perfil", response_model=MotoristaResponse)
@requer_autenticacao([Perfil.MOTORISTA.value])
async def obter_perfil(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Retorna o perfil do motorista logado (com a lista de veículos)."""
    assert usuario_logado is not None
    motorista = _obter_motorista_logado(usuario_logado)

    detalhe = motorista_repo.obter_detalhe(motorista.id)
    if detalhe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de motorista não encontrado.",
        )
    return MotoristaResponse.de_motorista(detalhe)


@router.put("/perfil", response_model=MotoristaResponse)
@requer_autenticacao([Perfil.MOTORISTA.value])
async def atualizar_perfil(
    request: Request,
    dto: AtualizarMotoristaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Atualiza os dados pessoais do motorista e o seu veículo principal."""
    assert usuario_logado is not None
    checar_rate_limit(motorista_perfil_limiter, request)
    motorista = _obter_motorista_logado(usuario_logado)

    # Dados pessoais
    motorista.cpf = dto.cpf
    motorista.telefone = dto.telefone
    motorista.cidade = dto.cidade
    motorista_repo.atualizar(motorista)

    # Veículo principal (1º veículo). Cria se ainda não houver nenhum.
    principal = veiculo_repo.obter_principal(motorista.id)
    if principal is not None:
        principal.tipo_veiculo_id = dto.tipo_veiculo_id
        principal.tipo_carroceria_id = dto.tipo_carroceria_id
        principal.placa = dto.placa
        principal.capacidade_kg = dto.capacidade_kg
        veiculo_repo.atualizar(principal)
    else:
        veiculo_repo.inserir(Veiculo(
            id=0,
            motorista_id=motorista.id,
            tipo_veiculo_id=dto.tipo_veiculo_id,
            tipo_carroceria_id=dto.tipo_carroceria_id,
            placa=dto.placa,
            capacidade_kg=dto.capacidade_kg,
            ativo=True,
        ))

    logger.info(f"Motorista {motorista.id} atualizou o próprio perfil")

    atualizado = motorista_repo.obter_detalhe(motorista.id)
    return MotoristaResponse.de_motorista(atualizado)
