"""Schema de resposta do módulo de Veículos (GiroChoffer)."""

from pydantic import BaseModel, Field

from model.veiculo_model import Veiculo


class VeiculoResponse(BaseModel):
    """Representação de um veículo de um motorista."""

    id: int
    tipo_veiculo: str = Field(..., description="Nome do tipo de veículo (catálogo)")
    carroceria: str = Field(..., description="Nome do tipo de carroceria (catálogo)")
    placa: str
    capacidade_kg: int
    ativo: bool

    @classmethod
    def de_veiculo(cls, veiculo: Veiculo) -> "VeiculoResponse":
        """Constrói o response a partir da entidade ``Veiculo``.

        Espera que ``tipo_veiculo_nome`` / ``carroceria_nome`` estejam populados
        (via leitura com JOIN no ``veiculo_repo``); caída para string vazia caso
        ausentes, para não quebrar a serialização.
        """
        return cls(
            id=veiculo.id,
            tipo_veiculo=veiculo.tipo_veiculo_nome or "",
            carroceria=veiculo.carroceria_nome or "",
            placa=veiculo.placa,
            capacidade_kg=veiculo.capacidade_kg,
            ativo=veiculo.ativo,
        )
