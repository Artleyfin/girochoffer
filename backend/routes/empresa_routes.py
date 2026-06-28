"""
Rotas do perfil Empresa (GiroChoffer — API JSON).

Permite que uma empresa logada:
- Liste suas próprias cargas (paginado, com filtro opcional por status).
- Publique novas cargas (status inicial Disponível).
- Veja o detalhe de uma carga sua, com a lista de motoristas interessados.
- Escolha um motorista (dentre os interessados) -> status Contratada.
- Conclua / cancele uma carga.
- Veja e atualize o próprio perfil de empresa.

Todas as rotas exigem o perfil Empresa (``@requer_autenticacao([Perfil.EMPRESA.value])``).
A empresa do usuário logado é resolvida via ``empresa_repo.obter_por_usuario_id``;
o acesso a cada carga é verificado contra ``empresa.id`` (404 se inexistente,
403 se a carga pertencer a outra empresa).
"""

# =============================================================================
# Imports
# =============================================================================

# Standard library
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Request, status

# DTOs (entrada)
from dtos.carga_dto import NovaCargaDTO, EscolherMotoristaDTO
from dtos.empresa_dto import AtualizarEmpresaDTO
from dtos.avaliacao_dto import AvaliarMotoristaDTO

# Schemas (saída)
from dtos.responses.carga_response import (
    CargaResumoResponse,
    CargaResponse,
    CargaDetalheResponse,
)
from dtos.responses.comum import PaginaResponse
from dtos.responses.empresa_response import EmpresaResponse
from dtos.responses.motorista_response import MotoristaResumoResponse
from dtos.responses.avaliacao_response import AvaliacaoResponse
from dtos.responses.comum import MensagemResponse

# Models
from model.carga_model import Carga, StatusCarga
from model.avaliacao_model import Avaliacao
from model.empresa_model import Empresa
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import (
    carga_repo,
    empresa_repo,
    interesse_carga_repo,
    favorito_motorista_repo,
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

router = APIRouter(prefix="/empresa")

# =============================================================================
# Rate Limiters
# =============================================================================

carga_criar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_carga_criar_max",
    chave_minutos="rate_limit_carga_criar_minutos",
    padrao_max=20,
    padrao_minutos=30,
    nome="carga_criar",
)
carga_listar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_carga_listar_max",
    chave_minutos="rate_limit_carga_listar_minutos",
    padrao_max=120,
    padrao_minutos=1,
    nome="carga_listar_empresa",
)
carga_acao_limiter = DynamicRateLimiter(
    chave_max="rate_limit_carga_acao_max",
    chave_minutos="rate_limit_carga_acao_minutos",
    padrao_max=60,
    padrao_minutos=10,
    nome="carga_acao",
)
empresa_perfil_limiter = DynamicRateLimiter(
    chave_max="rate_limit_empresa_perfil_max",
    chave_minutos="rate_limit_empresa_perfil_minutos",
    padrao_max=30,
    padrao_minutos=10,
    nome="empresa_perfil",
)
empresa_favorito_limiter = DynamicRateLimiter(
    chave_max="rate_limit_empresa_favorito_max",
    chave_minutos="rate_limit_empresa_favorito_minutos",
    padrao_max=60,
    padrao_minutos=10,
    nome="empresa_favorito",
)
empresa_avaliar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_empresa_avaliar_max",
    chave_minutos="rate_limit_empresa_avaliar_minutos",
    padrao_max=30,
    padrao_minutos=10,
    nome="empresa_avaliar",
)


# =============================================================================
# Helpers
# =============================================================================

def _obter_empresa_logada(usuario_logado: UsuarioLogado) -> Empresa:
    """Resolve a empresa do usuário logado (404 se não houver vínculo)."""
    empresa = empresa_repo.obter_por_usuario_id(usuario_logado.id)
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada para o usuário logado.",
        )
    return empresa


def _obter_carga_da_empresa(carga_id: int, empresa: Empresa) -> Carga:
    """Carrega a carga garantindo que pertence à empresa (404/403)."""
    carga = carga_repo.obter_por_id(carga_id)
    if not carga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carga não encontrada.",
        )
    if carga.empresa_id != empresa.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar esta carga.",
        )
    return carga


# =============================================================================
# Listagem de cargas da empresa
# =============================================================================

@router.get("/cargas", response_model=PaginaResponse[CargaResumoResponse])
@requer_autenticacao([Perfil.EMPRESA.value])
async def listar_cargas(
    request: Request,
    status_filtro: Optional[str] = None,
    pagina: int = 1,
    por_pagina: int = 10,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista as cargas da empresa logada (paginado, filtro opcional por status)."""
    assert usuario_logado is not None
    checar_rate_limit(carga_listar_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    status_enum: Optional[StatusCarga] = None
    if status_filtro:
        try:
            status_enum = StatusCarga(status_filtro)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Status inválido: '{status_filtro}'.",
            )

    cargas = carga_repo.obter_por_empresa(empresa.id, status_enum)
    paginacao = paginar(cargas, pagina, por_pagina)
    return PaginaResponse.de_paginacao(
        paginacao,
        [CargaResumoResponse.de_carga(c) for c in paginacao.items],
    )


# =============================================================================
# Criação de carga
# =============================================================================

@router.post(
    "/cargas",
    response_model=CargaResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao([Perfil.EMPRESA.value])
async def criar_carga(
    request: Request,
    dto: NovaCargaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Publica uma nova carga da empresa logada (status inicial Disponível)."""
    assert usuario_logado is not None
    checar_rate_limit(carga_criar_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    carga = Carga(
        id=0,
        empresa_id=empresa.id,
        titulo=dto.titulo,
        origem=dto.origem,
        destino=dto.destino,
        tipo_veiculo_id=dto.tipo_veiculo_id,
        tipo_carroceria_id=dto.tipo_carroceria_id,
        valor_frete=dto.valor_frete,
        descricao=dto.descricao,
        status=StatusCarga.DISPONIVEL,
        peso_kg=dto.peso_kg,
        volume_m3=dto.volume_m3,
        data_coleta=dto.data_coleta,
        foto_url=None,
    )
    carga_id = carga_repo.inserir(carga)
    if not carga_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao publicar a carga. Tente novamente.",
        )

    logger.info(
        f"Carga #{carga_id} '{dto.titulo}' publicada pela empresa {empresa.id}"
    )

    criada = carga_repo.obter_por_id(carga_id)
    return CargaResponse.de_carga(criada)


# =============================================================================
# Detalhe de carga (com interessados)
# =============================================================================

@router.get("/cargas/{id}", response_model=CargaDetalheResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def obter_carga(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Detalhe de uma carga da empresa, incluindo a lista de interessados."""
    assert usuario_logado is not None

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    interessados_dicts = interesse_carga_repo.obter_motoristas_da_carga(id)
    interessados = [
        MotoristaResumoResponse(**d) for d in interessados_dicts
    ]
    return CargaDetalheResponse.de_carga(carga, interessados)


# =============================================================================
# Escolher motorista (-> Contratada)
# =============================================================================

@router.patch("/cargas/{id}/escolher", response_model=CargaResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def escolher_motorista(
    request: Request,
    id: int,
    dto: EscolherMotoristaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Escolhe um motorista (dentre os interessados) e contrata a carga."""
    assert usuario_logado is not None
    checar_rate_limit(carga_acao_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    if carga.status != StatusCarga.DISPONIVEL:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível escolher um motorista para cargas disponíveis.",
        )

    if not interesse_carga_repo.existe(id, dto.motorista_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O motorista informado não manifestou interesse nesta carga.",
        )

    if not carga_repo.escolher_motorista(id, dto.motorista_id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao contratar o motorista. Tente novamente.",
        )

    logger.info(
        f"Carga #{id} contratada pela empresa {empresa.id} "
        f"(motorista {dto.motorista_id})"
    )

    atualizada = carga_repo.obter_por_id(id)
    return CargaResponse.de_carga(atualizada)


# =============================================================================
# Concluir carga
# =============================================================================

@router.patch("/cargas/{id}/concluir", response_model=CargaResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def concluir_carga(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Marca a carga como Concluída (apenas se estiver Contratada)."""
    assert usuario_logado is not None
    checar_rate_limit(carga_acao_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    if carga.status != StatusCarga.CONTRATADA:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Apenas cargas contratadas podem ser concluídas.",
        )

    if not carga_repo.definir_status(id, StatusCarga.CONCLUIDA):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao concluir a carga. Tente novamente.",
        )

    logger.info(f"Carga #{id} concluída pela empresa {empresa.id}")

    atualizada = carga_repo.obter_por_id(id)
    return CargaResponse.de_carga(atualizada)


# =============================================================================
# Cancelar carga
# =============================================================================

@router.patch("/cargas/{id}/cancelar", response_model=CargaResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def cancelar_carga(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Marca a carga como Cancelada (não permitido se já concluída)."""
    assert usuario_logado is not None
    checar_rate_limit(carga_acao_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    if carga.status in (StatusCarga.CONCLUIDA, StatusCarga.CANCELADA):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta carga não pode mais ser cancelada.",
        )

    if not carga_repo.definir_status(id, StatusCarga.CANCELADA):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao cancelar a carga. Tente novamente.",
        )

    logger.info(f"Carga #{id} cancelada pela empresa {empresa.id}")

    atualizada = carga_repo.obter_por_id(id)
    return CargaResponse.de_carga(atualizada)


# =============================================================================
# Perfil da empresa
# =============================================================================

@router.get("/perfil", response_model=EmpresaResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def obter_perfil(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Retorna o perfil da empresa logada."""
    assert usuario_logado is not None
    empresa = _obter_empresa_logada(usuario_logado)
    return EmpresaResponse.de_empresa(empresa)


@router.put("/perfil", response_model=EmpresaResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def atualizar_perfil(
    request: Request,
    dto: AtualizarEmpresaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Atualiza os dados do perfil da empresa logada."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_perfil_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    empresa.cnpj = dto.cnpj
    empresa.razao_social = dto.razao_social
    empresa.nome_fantasia = dto.nome_fantasia
    empresa.telefone = dto.telefone
    empresa.whatsapp = dto.whatsapp

    if not empresa_repo.atualizar(empresa):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar o perfil. Tente novamente.",
        )

    logger.info(f"Perfil da empresa {empresa.id} atualizado.")

    atualizada = empresa_repo.obter_por_usuario_id(usuario_logado.id)
    return EmpresaResponse.de_empresa(atualizada)

# =============================================================================
# Favoritar motorista (N:N empresa <-> motorista)
# =============================================================================

@router.post("/favoritos/{motorista_id}", response_model=MensagemResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def favoritar_motorista(
    request: Request,
    motorista_id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Marca um motorista como favorito da empresa logada (idempotente; 409 se já existe)."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_favorito_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    if favorito_motorista_repo.existe(empresa.id, motorista_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este motorista já está nos seus favoritos.",
        )

    favorito_id = favorito_motorista_repo.inserir(empresa.id, motorista_id)
    if not favorito_id:
        # Corrida: outro request inseriu entre o existe() e o inserir().
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este motorista já está nos seus favoritos.",
        )

    logger.info(f"Empresa {empresa.id} favoritou o motorista {motorista_id}")
    return MensagemResponse(message="Motorista adicionado aos favoritos.")


@router.delete("/favoritos/{motorista_id}", response_model=MensagemResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def desfavoritar_motorista(
    request: Request,
    motorista_id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Remove um motorista dos favoritos da empresa logada (404 se não era favorito)."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_favorito_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    if not favorito_motorista_repo.remover(empresa.id, motorista_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este motorista não estava nos seus favoritos.",
        )

    logger.info(f"Empresa {empresa.id} removeu o motorista {motorista_id} dos favoritos")
    return MensagemResponse(message="Motorista removido dos favoritos.")


@router.get("/favoritos", response_model=list[MotoristaResumoResponse])
@requer_autenticacao([Perfil.EMPRESA.value])
async def listar_favoritos(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista os motoristas favoritados pela empresa logada."""
    assert usuario_logado is not None

    empresa = _obter_empresa_logada(usuario_logado)

    favoritos_dicts = favorito_motorista_repo.obter_motoristas_da_empresa(empresa.id)
    return [MotoristaResumoResponse(**d) for d in favoritos_dicts]


# =============================================================================
# Avaliar motorista (apenas carga Concluída)
# =============================================================================

@router.post("/cargas/{id}/avaliar", response_model=AvaliacaoResponse, status_code=status.HTTP_201_CREATED)
@requer_autenticacao([Perfil.EMPRESA.value])
async def avaliar_motorista(
    request: Request,
    id: int,
    dto: AvaliarMotoristaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Avalia o motorista que fez o frete. Só permitido se a carga estiver Concluída."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_avaliar_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    if carga.status != StatusCarga.CONCLUIDA:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível avaliar uma carga já concluída.",
        )

    if carga.motorista_escolhido_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Esta carga não tem um motorista contratado para avaliar.",
        )

    if avaliacao_repo.existe_por_carga(id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta carga já foi avaliada.",
        )

    avaliacao = Avaliacao(
        id=0,
        carga_id=id,
        empresa_id=empresa.id,
        motorista_id=carga.motorista_escolhido_id,
        nota=dto.nota,
        comentario=dto.comentario,
    )
    avaliacao_id = avaliacao_repo.inserir(avaliacao)
    if not avaliacao_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar a avaliação. Tente novamente.",
        )

    # Recalcula e grava a média do motorista (motorista.nota).
    avaliacao_repo.recalcular_nota_motorista(carga.motorista_escolhido_id)

    logger.info(
        f"Empresa {empresa.id} avaliou a carga {id} "
        f"(motorista {carga.motorista_escolhido_id}, nota {dto.nota})"
    )

    criada = avaliacao_repo.obter_por_motorista(carga.motorista_escolhido_id)
    # A avaliação recém-criada é a mais recente (lista ordenada por data DESC).
    return AvaliacaoResponse.de_avaliacao(criada[0])
