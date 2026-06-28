"""
DTO de entrada da avaliação de um motorista (POST /empresa/cargas/{id}/avaliar).

Reaproveita os validators de dtos/validators.py: a nota é um inteiro de 1 a 5
e o comentário é opcional (até 500 caracteres).
"""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_inteiro_range, validar_comprimento


class AvaliarMotoristaDTO(BaseModel):
    """Corpo do POST /empresa/cargas/{id}/avaliar."""

    nota: int = Field(..., description="Nota de 1 a 5")
    comentario: Optional[str] = Field(default=None, description="Comentário (opcional)")

    _validar_nota = field_validator("nota")(
        validar_inteiro_range(min_valor=1, max_valor=5, nome_campo="Nota")
    )

    _validar_comentario = field_validator("comentario")(
        validar_comprimento(tamanho_maximo=500)
    )
