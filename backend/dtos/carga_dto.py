"""
DTOs de entrada do módulo de cargas (fretes).

- NovaCargaDTO: criação de carga por uma empresa. Reaproveita os validators
  de dtos/validators.py para os campos de texto; ids de catálogo e valores
  numéricos são validados como inteiros/floats positivos.
- EscolherMotoristaDTO: corpo do PATCH que escolhe o motorista de uma carga.
"""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import (
    validar_string_obrigatoria,
    validar_id_positivo,
)


class NovaCargaDTO(BaseModel):
    """DTO para criação de uma carga (status inicial sempre Disponível)."""

    titulo: str = Field(..., description="Título resumido da carga")
    origem: str = Field(..., description="Origem no formato 'Cidade/UF'")
    destino: str = Field(..., description="Destino no formato 'Cidade/UF'")
    tipo_veiculo_id: int = Field(..., description="ID do tipo de veículo exigido")
    tipo_carroceria_id: int = Field(..., description="ID do tipo de carroceria exigido")
    peso_kg: Optional[int] = Field(default=None, description="Peso da carga em kg")
    volume_m3: Optional[float] = Field(default=None, description="Volume em m³")
    valor_frete: float = Field(..., description="Valor oferecido pelo frete (R$)")
    data_coleta: Optional[str] = Field(
        default=None, description="Data prevista de coleta (texto livre/ISO)"
    )
    descricao: str = Field(..., description="Descrição detalhada da carga")

    _validar_titulo = field_validator("titulo")(
        validar_string_obrigatoria(
            nome_campo="Título", tamanho_minimo=5, tamanho_maximo=200
        )
    )

    _validar_origem = field_validator("origem")(
        validar_string_obrigatoria(
            nome_campo="Origem", tamanho_minimo=2, tamanho_maximo=120
        )
    )

    _validar_destino = field_validator("destino")(
        validar_string_obrigatoria(
            nome_campo="Destino", tamanho_minimo=2, tamanho_maximo=120
        )
    )

    _validar_descricao = field_validator("descricao")(
        validar_string_obrigatoria(
            nome_campo="Descrição", tamanho_minimo=10, tamanho_maximo=2000
        )
    )

    _validar_tipo_veiculo_id = field_validator("tipo_veiculo_id")(
        validar_id_positivo(nome_campo="Tipo de veículo")
    )

    _validar_tipo_carroceria_id = field_validator("tipo_carroceria_id")(
        validar_id_positivo(nome_campo="Tipo de carroceria")
    )

    @field_validator("valor_frete")
    @classmethod
    def _validar_valor_frete(cls, v: float) -> float:
        if v is None or v <= 0:
            raise ValueError("Valor do frete deve ser maior que zero.")
        return v

    @field_validator("peso_kg")
    @classmethod
    def _validar_peso(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Peso deve ser maior que zero.")
        return v

    @field_validator("volume_m3")
    @classmethod
    def _validar_volume(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Volume deve ser maior que zero.")
        return v


class EscolherMotoristaDTO(BaseModel):
    """DTO do corpo do PATCH /empresa/cargas/{id}/escolher."""

    motorista_id: int = Field(..., description="ID do motorista escolhido")

    _validar_motorista_id = field_validator("motorista_id")(
        validar_id_positivo(nome_campo="Motorista")
    )
