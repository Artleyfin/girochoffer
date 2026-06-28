"""
Modelo de domínio de avaliação (GiroChoffer).

Uma avaliação registra a nota (1..5) e um comentário que a empresa dá ao
motorista após a conclusão de uma carga. Os campos empresa_nome e carga_titulo
são derivados de JOIN, apenas para exibição (não são colunas próprias).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Avaliacao:
    """Avaliação de um motorista por uma empresa, referente a uma carga."""

    id: int
    carga_id: int
    empresa_id: int
    motorista_id: int
    nota: int
    comentario: Optional[str] = None
    data: Optional[datetime] = None
    # Campos derivados (JOIN) — só para exibição
    empresa_nome: Optional[str] = None
    carga_titulo: Optional[str] = None
