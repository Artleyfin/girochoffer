"""DTOs de entrada do módulo Empresa."""
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import (
    validar_cnpj,
    validar_string_obrigatoria,
    validar_telefone_br,
)


class AtualizarEmpresaDTO(BaseModel):
    """DTO para atualização do perfil da empresa (PUT /empresa/perfil)."""

    cnpj: str = Field(..., description="CNPJ da empresa (somente dígitos ou formatado)")
    razao_social: str = Field(..., description="Razão social da empresa")
    nome_fantasia: str = Field(..., description="Nome fantasia da empresa")
    telefone: str = Field(..., description="Telefone de contato")
    whatsapp: Optional[str] = Field(
        default=None, description="WhatsApp de contato (opcional)"
    )

    _validar_cnpj = field_validator("cnpj")(validar_cnpj())

    _validar_razao_social = field_validator("razao_social")(
        validar_string_obrigatoria(
            nome_campo="Razão social", tamanho_minimo=3, tamanho_maximo=200
        )
    )

    _validar_nome_fantasia = field_validator("nome_fantasia")(
        validar_string_obrigatoria(
            nome_campo="Nome fantasia", tamanho_minimo=2, tamanho_maximo=200
        )
    )

    _validar_telefone = field_validator("telefone")(validar_telefone_br())

    @field_validator("whatsapp")
    @classmethod
    def _validar_whatsapp(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        # Reaproveita a validação de telefone br para o WhatsApp opcional.
        return validar_telefone_br()(cls, v)
