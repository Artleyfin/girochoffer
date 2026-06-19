"""Schemas de resposta do módulo de catálogo (tipos de veículo e carrocerias)."""

from pydantic import BaseModel

from model.catalogo_model import TipoVeiculo, TipoCarroceria


class ItemCatalogoResponse(BaseModel):
    """Item simples de catálogo (id + nome)."""

    id: int
    nome: str

    @classmethod
    def de_tipo_veiculo(cls, tipo: TipoVeiculo) -> "ItemCatalogoResponse":
        """Constrói o response a partir de um TipoVeiculo."""
        return cls(id=tipo.id, nome=tipo.nome)

    @classmethod
    def de_carroceria(cls, tipo: TipoCarroceria) -> "ItemCatalogoResponse":
        """Constrói o response a partir de um TipoCarroceria."""
        return cls(id=tipo.id, nome=tipo.nome)


class CatalogoResponse(BaseModel):
    """Catálogo completo de tipos de veículo e carrocerias (apenas ativos)."""

    tipos_veiculo: list[ItemCatalogoResponse]
    carrocerias: list[ItemCatalogoResponse]

    @classmethod
    def de_listas(
        cls,
        tipos_veiculo: list[TipoVeiculo],
        carrocerias: list[TipoCarroceria],
    ) -> "CatalogoResponse":
        """Constrói o response a partir das listas de entidades de domínio."""
        return cls(
            tipos_veiculo=[
                ItemCatalogoResponse.de_tipo_veiculo(t) for t in tipos_veiculo
            ],
            carrocerias=[
                ItemCatalogoResponse.de_carroceria(c) for c in carrocerias
            ],
        )
