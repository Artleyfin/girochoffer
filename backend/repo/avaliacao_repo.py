"""
Repositório de Avaliações (GiroChoffer).

- inserir(): grava a avaliação (data via agora()). carga_id é UNIQUE: a rota deve
  checar existe_por_carga() antes para responder 409.
- media_por_motorista(): média das notas (0.0 se ainda não houver avaliações).
- recalcular_nota_motorista(): grava a média atual em motorista.nota.
- obter_por_motorista(): avaliações recebidas, com nome da empresa e título da
  carga (para exibição).
"""

import sqlite3
from typing import Optional

from model.avaliacao_model import Avaliacao
from sql.avaliacao_sql import (
    CRIAR_TABELA,
    INSERIR,
    EXISTE_POR_CARGA,
    MEDIA_POR_MOTORISTA,
    OBTER_POR_MOTORISTA,
)
from util.datetime_util import agora
from util.db_util import obter_conexao


def _row_to_avaliacao(row: sqlite3.Row) -> Avaliacao:
    """Converte sqlite3.Row em dataclass Avaliacao (com campos de JOIN)."""
    chaves = row.keys()
    return Avaliacao(
        id=row["id"],
        carga_id=row["carga_id"],
        empresa_id=row["empresa_id"],
        motorista_id=row["motorista_id"],
        nota=row["nota"],
        comentario=row["comentario"],
        data=row["data"],
        empresa_nome=row["empresa_nome"] if "empresa_nome" in chaves else None,
        carga_titulo=row["carga_titulo"] if "carga_titulo" in chaves else None,
    )


def criar_tabela() -> bool:
    """Cria a tabela de avaliações se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def existe_por_carga(carga_id: int) -> bool:
    """Verifica se a carga já foi avaliada (carga_id é UNIQUE)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE_POR_CARGA, (carga_id,))
        return cursor.fetchone() is not None


def inserir(avaliacao: Avaliacao) -> Optional[int]:
    """
    Insere uma avaliação e retorna o id gerado.

    A data é definida via agora() (timezone da aplicação). carga_id é UNIQUE; a
    rota deve checar existe_por_carga() antes para responder 409 explicitamente.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            avaliacao.carga_id,
            avaliacao.empresa_id,
            avaliacao.motorista_id,
            avaliacao.nota,
            avaliacao.comentario,
            agora(),
        ))
        return cursor.lastrowid


def media_por_motorista(motorista_id: int) -> float:
    """Média das notas do motorista (0.0 se ele ainda não tem avaliações)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(MEDIA_POR_MOTORISTA, (motorista_id,))
        row = cursor.fetchone()
        media = row["media"] if row else None
        return round(float(media), 2) if media is not None else 0.0


def recalcular_nota_motorista(motorista_id: int) -> float:
    """
    Recalcula a média do motorista e grava em motorista.nota. Retorna a média.
    """
    media = media_por_motorista(motorista_id)
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE motorista SET nota = ? WHERE id = ?",
            (media, motorista_id),
        )
    return media


def obter_por_motorista(motorista_id: int) -> list[Avaliacao]:
    """Lista as avaliações recebidas por um motorista (mais recentes primeiro)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_MOTORISTA, (motorista_id,))
        return [_row_to_avaliacao(row) for row in cursor.fetchall()]
