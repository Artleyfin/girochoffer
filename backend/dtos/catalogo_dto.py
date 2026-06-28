from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_string_obrigatoria


class CatalogoItemDTO(BaseModel):
    """DTO de entrada para criar ou renomear um item de catálogo (tipo de
    veículo ou carroceria). Apenas o nome — id vem pela URL."""

    nome: str = Field(..., description="Nome do tipo (ex.: Caminhão, Baú)")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(
            nome_campo="Nome",
            tamanho_minimo=2,
            tamanho_maximo=64,
        )
    )


class AtualizarAtivoDTO(BaseModel):
    """DTO de entrada para ativar/desativar um item de catálogo."""

    ativo: bool = Field(..., description="Define se o item fica ativo (True) ou inativo (False)")
