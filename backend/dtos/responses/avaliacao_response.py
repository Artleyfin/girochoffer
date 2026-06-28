"""
Schema de resposta de avaliação (GiroChoffer).

Factory de_avaliacao() monta o response a partir da entidade Avaliacao, incluindo
os campos derivados (empresa_nome, carga_titulo) usados na lista do motorista.
"""

from typing import Optional

from pydantic import BaseModel

from model.avaliacao_model import Avaliacao


class AvaliacaoResponse(BaseModel):
    """Avaliação na visão de quem a recebeu (motorista) ou de quem a criou."""

    id: int
    carga_id: int
    empresa_id: int
    motorista_id: int
    nota: int
    comentario: Optional[str] = None
    data: Optional[str] = None
    empresa_nome: Optional[str] = None
    carga_titulo: Optional[str] = None

    @classmethod
    def de_avaliacao(cls, avaliacao: Avaliacao) -> "AvaliacaoResponse":
        """Constrói o response a partir da entidade Avaliacao."""
        return cls(
            id=avaliacao.id,
            carga_id=avaliacao.carga_id,
            empresa_id=avaliacao.empresa_id,
            motorista_id=avaliacao.motorista_id,
            nota=avaliacao.nota,
            comentario=avaliacao.comentario,
            data=str(avaliacao.data) if avaliacao.data else None,
            empresa_nome=avaliacao.empresa_nome,
            carga_titulo=avaliacao.carga_titulo,
        )
