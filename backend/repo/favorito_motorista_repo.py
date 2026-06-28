"""
Repositório de Favoritos de Motorista (N:N empresa <-> motorista).

Espelha o padrão de interesse_carga_repo:
- existe(): permite à rota responder 409 sem depender da exceção de integridade.
- inserir(): idempotente; se já existir (viola UNIQUE), retorna None.
- remover(): apaga o vínculo (idempotente; True se removeu alguma linha).
- obter_motoristas_da_empresa(): retorna dicts no formato "resumo de motorista".
"""

import sqlite3
from typing import Optional

from sql.favorito_motorista_sql import (
    CRIAR_TABELA,
    INSERIR,
    EXISTE,
    REMOVER,
    OBTER_MOTORISTAS_POR_EMPRESA,
)
from util.db_util import obter_conexao
from util.logger_config import logger


def _row_to_motorista_resumo(row: sqlite3.Row) -> dict:
    """Converte row em dict no formato MotoristaResumo (campos de exibição)."""
    return {
        "id": row["motorista_id"],
        "nome": row["nome"],
        "cidade": row["cidade"],
        "nota": row["nota"],
        "total_viagens": row["total_viagens"],
        "foto_url": row["foto_url"],
        "veiculo_principal": row["veiculo_principal"],
        "carroceria": row["carroceria"],
        "capacidade_kg": row["capacidade_kg"],
    }


def criar_tabela() -> bool:
    """Cria a tabela de favoritos se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def existe(empresa_id: int, motorista_id: int) -> bool:
    """Verifica se essa empresa já favoritou esse motorista."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE, (empresa_id, motorista_id))
        return cursor.fetchone() is not None


def inserir(empresa_id: int, motorista_id: int) -> Optional[int]:
    """
    Marca um motorista como favorito de uma empresa.

    Idempotente: se já existir (viola UNIQUE), retorna None em vez de propagar a
    exceção de integridade. A rota deve checar existe() antes para responder 409.
    """
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(INSERIR, (empresa_id, motorista_id))
            return cursor.lastrowid
    except sqlite3.IntegrityError:
        logger.info(
            f"Favorito já existente (empresa={empresa_id}, motorista={motorista_id})."
        )
        return None


def remover(empresa_id: int, motorista_id: int) -> bool:
    """Remove o favorito (True se alguma linha foi apagada)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(REMOVER, (empresa_id, motorista_id))
        return cursor.rowcount > 0


def obter_motoristas_da_empresa(empresa_id: int) -> list[dict]:
    """Lista os motoristas favoritados por uma empresa, como dicts de resumo."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_MOTORISTAS_POR_EMPRESA, (empresa_id,))
        return [_row_to_motorista_resumo(row) for row in cursor.fetchall()]
