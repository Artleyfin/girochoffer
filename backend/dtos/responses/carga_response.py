"""Schemas de resposta do módulo de cargas (fretes).

Hierarquia (do mais leve ao mais completo):

- ``CargaResumoResponse``: card de listagem (vitrine do motorista, painel da
  empresa). Inclui ``status_rotulo``, que deriva "Com interessados" quando a
  carga está Disponível e tem ao menos um interessado.
- ``CargaResponse``: resumo + descrição e demais campos de detalhe.
- ``CargaDetalheResponse``: ``CargaResponse`` + a lista de ``interessados``
  (apenas nas rotas da empresa dona da carga).

Todas as factories ``de_carga`` espelham os campos da dataclass ``Carga``,
serializando o enum de status via ``.value``.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from model.carga_model import Carga, StatusCarga
from dtos.responses.motorista_response import MotoristaResumoResponse

# Rótulo derivado (não é status armazenado) exibido quando há interessados.
ROTULO_COM_INTERESSADOS = "Com interessados"


def _derivar_status_rotulo(carga: Carga) -> str:
    """Deriva o rótulo de exibição do status.

    Regra do contrato: carga Disponível com ``total_interesses > 0`` é exibida
    como "Com interessados"; nos demais casos usa-se o próprio valor do status.
    """
    if carga.status == StatusCarga.DISPONIVEL and (carga.total_interesses or 0) > 0:
        return ROTULO_COM_INTERESSADOS
    return carga.status.value


class CargaResumoResponse(BaseModel):
    """Card resumido de uma carga para listagens."""

    id: int
    titulo: str
    origem: str
    destino: str
    tipo_veiculo: Optional[str] = Field(
        default=None, description="Nome do tipo de veículo exigido"
    )
    carroceria: Optional[str] = Field(
        default=None, description="Nome do tipo de carroceria exigido"
    )
    peso_kg: Optional[int] = None
    valor_frete: float
    status: str = Field(..., description="Status armazenado da carga")
    status_rotulo: str = Field(
        ..., description="Rótulo de exibição (pode ser 'Com interessados')"
    )
    total_interesses: int = 0
    foto_url: Optional[str] = None
    empresa_nome: Optional[str] = None
    data_coleta: Optional[str] = None

    @classmethod
    def de_carga(cls, carga: Carga) -> "CargaResumoResponse":
        return cls(
            id=carga.id,
            titulo=carga.titulo,
            origem=carga.origem,
            destino=carga.destino,
            tipo_veiculo=carga.tipo_veiculo_nome,
            carroceria=carga.carroceria_nome,
            peso_kg=carga.peso_kg,
            valor_frete=carga.valor_frete,
            status=carga.status.value,
            status_rotulo=_derivar_status_rotulo(carga),
            total_interesses=carga.total_interesses or 0,
            foto_url=carga.foto_url,
            empresa_nome=carga.empresa_nome,
            data_coleta=carga.data_coleta,
        )


class CargaResponse(CargaResumoResponse):
    """Representação completa de uma carga (sem a lista de interessados)."""

    descricao: str
    volume_m3: Optional[float] = None
    empresa_id: int
    motorista_escolhido_id: Optional[int] = None
    data_publicacao: Optional[datetime] = None

    @classmethod
    def de_carga(cls, carga: Carga) -> "CargaResponse":
        return cls(
            id=carga.id,
            titulo=carga.titulo,
            origem=carga.origem,
            destino=carga.destino,
            tipo_veiculo=carga.tipo_veiculo_nome,
            carroceria=carga.carroceria_nome,
            peso_kg=carga.peso_kg,
            valor_frete=carga.valor_frete,
            status=carga.status.value,
            status_rotulo=_derivar_status_rotulo(carga),
            total_interesses=carga.total_interesses or 0,
            foto_url=carga.foto_url,
            empresa_nome=carga.empresa_nome,
            data_coleta=carga.data_coleta,
            descricao=carga.descricao,
            volume_m3=carga.volume_m3,
            empresa_id=carga.empresa_id,
            motorista_escolhido_id=carga.motorista_escolhido_id,
            data_publicacao=carga.data_publicacao,
        )


class CargaDetalheResponse(CargaResponse):
    """Detalhe de uma carga incluindo a lista de motoristas interessados.

    Usado apenas nas rotas da empresa dona da carga.
    """

    interessados: list[MotoristaResumoResponse] = Field(default_factory=list)

    @classmethod
    def de_carga(
        cls,
        carga: Carga,
        interessados: Optional[list[MotoristaResumoResponse]] = None,
    ) -> "CargaDetalheResponse":
        return cls(
            id=carga.id,
            titulo=carga.titulo,
            origem=carga.origem,
            destino=carga.destino,
            tipo_veiculo=carga.tipo_veiculo_nome,
            carroceria=carga.carroceria_nome,
            peso_kg=carga.peso_kg,
            valor_frete=carga.valor_frete,
            status=carga.status.value,
            status_rotulo=_derivar_status_rotulo(carga),
            total_interesses=carga.total_interesses or 0,
            foto_url=carga.foto_url,
            empresa_nome=carga.empresa_nome,
            data_coleta=carga.data_coleta,
            descricao=carga.descricao,
            volume_m3=carga.volume_m3,
            empresa_id=carga.empresa_id,
            motorista_escolhido_id=carga.motorista_escolhido_id,
            data_publicacao=carga.data_publicacao,
            interessados=interessados or [],
        )
