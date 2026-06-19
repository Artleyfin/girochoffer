"""DTOs de entrada do módulo de Motorista (GiroChoffer).

``AtualizarMotoristaDTO`` cobre os dados pessoais do motorista e os dados do
veículo principal (primeiro veículo), conforme o contrato de
``PUT /api/motorista/perfil``. A rota é responsável por aplicar as mudanças
no motorista e no veículo principal correspondente.
"""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import (
    validar_cpf,
    validar_telefone_br,
    validar_comprimento,
    validar_inteiro_range,
    validar_id_positivo,
)


class AtualizarMotoristaDTO(BaseModel):
    """Atualização de dados pessoais do motorista + veículo principal."""

    # --- Dados pessoais ---
    cpf: str = Field(..., description="CPF do motorista (somente dígitos ou formatado)")
    telefone: str = Field(..., description="Telefone de contato do motorista")
    cidade: Optional[str] = Field(
        default=None, description="Cidade base do motorista (Cidade/UF)"
    )

    # --- Veículo principal ---
    tipo_veiculo_id: int = Field(..., description="ID do tipo de veículo (catálogo)")
    tipo_carroceria_id: int = Field(
        ..., description="ID do tipo de carroceria (catálogo)"
    )
    placa: str = Field(..., description="Placa do veículo principal")
    capacidade_kg: int = Field(..., description="Capacidade de carga em quilos")

    _validar_cpf = field_validator("cpf")(validar_cpf(formatar=False))
    _validar_telefone = field_validator("telefone")(
        validar_telefone_br(formatar=False)
    )
    _validar_cidade = field_validator("cidade")(
        validar_comprimento(tamanho_minimo=2, tamanho_maximo=120)
    )
    _validar_placa = field_validator("placa")(
        validar_comprimento(tamanho_minimo=7, tamanho_maximo=8)
    )
    _validar_capacidade = field_validator("capacidade_kg")(
        validar_inteiro_range(1, 1_000_000, "Capacidade (kg)")
    )
    _validar_tipo_veiculo = field_validator("tipo_veiculo_id")(
        validar_id_positivo("Tipo de veículo")
    )
    _validar_tipo_carroceria = field_validator("tipo_carroceria_id")(
        validar_id_positivo("Tipo de carroceria")
    )

    @field_validator("placa")
    @classmethod
    def _normalizar_placa(cls, v: str) -> str:
        return v.strip().upper().replace("-", "") if v else v
