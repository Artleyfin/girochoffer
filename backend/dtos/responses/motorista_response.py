"""Schemas de resposta do módulo de Motoristas (GiroChoffer).

- ``MotoristaResponse``: visão completa do próprio motorista (perfil), com a
  lista de veículos.
- ``MotoristaResumoResponse``: visão compacta usada na lista de interessados
  de uma carga (lado empresa), com os dados do veículo principal achatados.
"""

from typing import Optional

from pydantic import BaseModel, Field

from model.motorista_model import Motorista
from model.veiculo_model import Veiculo
from dtos.responses.veiculo_response import VeiculoResponse


class MotoristaResponse(BaseModel):
    """Representação completa de um motorista (perfil próprio)."""

    id: int
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: str
    cpf: str
    cidade: Optional[str] = None
    nota: float
    total_viagens: int
    foto_url: Optional[str] = None
    verificado: bool
    veiculos: list[VeiculoResponse] = Field(default_factory=list)

    @classmethod
    def de_motorista(cls, motorista: Motorista) -> "MotoristaResponse":
        """Constrói o response a partir da entidade ``Motorista``.

        Usa ``motorista.veiculos`` (populado via ``motorista_repo.obter_detalhe``).
        """
        return cls(
            id=motorista.id,
            nome=motorista.nome,
            email=motorista.email,
            telefone=motorista.telefone,
            cpf=motorista.cpf,
            cidade=motorista.cidade,
            nota=motorista.nota,
            total_viagens=motorista.total_viagens,
            foto_url=motorista.foto_url,
            verificado=motorista.verificado,
            veiculos=[VeiculoResponse.de_veiculo(v) for v in motorista.veiculos],
        )


class MotoristaResumoResponse(BaseModel):
    """Resumo de um motorista para a lista de interessados de uma carga."""

    id: int
    nome: Optional[str] = None
    cidade: Optional[str] = None
    nota: float
    total_viagens: int
    foto_url: Optional[str] = None
    veiculo_principal: str = Field(
        default="", description="Nome do tipo do veículo principal"
    )
    carroceria: str = Field(
        default="", description="Nome da carroceria do veículo principal"
    )
    capacidade_kg: Optional[int] = Field(
        default=None, description="Capacidade do veículo principal em kg"
    )

    @classmethod
    def de_motorista(
        cls,
        motorista: Motorista,
        veiculo_principal: Optional[Veiculo] = None,
    ) -> "MotoristaResumoResponse":
        """Constrói o resumo a partir do motorista e do veículo principal.

        ``veiculo_principal`` deve vir do ``veiculo_repo`` (com JOIN nos
        catálogos). Se ausente, tenta usar o primeiro item de
        ``motorista.veiculos``; caindo para valores neutros se não houver veículo.
        """
        veiculo = veiculo_principal
        if veiculo is None and motorista.veiculos:
            veiculo = motorista.veiculos[0]

        return cls(
            id=motorista.id,
            nome=motorista.nome,
            cidade=motorista.cidade,
            nota=motorista.nota,
            total_viagens=motorista.total_viagens,
            foto_url=motorista.foto_url,
            veiculo_principal=(veiculo.tipo_veiculo_nome or "") if veiculo else "",
            carroceria=(veiculo.carroceria_nome or "") if veiculo else "",
            capacidade_kg=veiculo.capacidade_kg if veiculo else None,
        )
