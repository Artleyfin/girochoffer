"""
Repositório de Interesses de Carga (N:N carga <-> motorista).

Acesso a dados da tabela `interesse_carga`. SQL puro com prepared statements.

- inserir(): registra o interesse; idempotência é garantida pelo UNIQUE no
  banco — a checagem prévia existe() permite às rotas (B5) responderem 409
  sem depender da exceção de integridade.
- obter_motoristas_da_carga(): retorna dicts no formato "resumo de motorista"
  (id, nome, cidade, nota, total_viagens, foto_url, veiculo_principal,
  carroceria, capacidade_kg) — dicts, e não dataclass, para não acoplar este
  módulo ao módulo de motorista (B2).
- obter_cargas_do_motorista(): retorna dataclasses Carga (reaproveita o
  conversor de carga_repo), agrupáveis por status na camada de rota.
"""

import sqlite3
from typing import Optional

from model.carga_model import Carga, StatusCarga
from sql.interesse_carga_sql import (
    CRIAR_TABELA,
    INSERIR,
    EXISTE,
    OBTER_MOTORISTAS_POR_CARGA,
    OBTER_CARGAS_POR_MOTORISTA,
)
from repo.carga_repo import _row_to_carga
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
    """Cria a tabela de interesses se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def existe(carga_id: int, motorista_id: int) -> bool:
    """Verifica se já há interesse desse motorista nessa carga."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE, (carga_id, motorista_id))
        return cursor.fetchone() is not None


def inserir(carga_id: int, motorista_id: int) -> Optional[int]:
    """
    Registra o interesse de um motorista por uma carga.

    Idempotente: se já existir (viola UNIQUE), retorna None em vez de
    propagar a exceção de integridade. As rotas devem checar existe()
    antes para responder 409 de forma explícita.
    """
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(INSERIR, (carga_id, motorista_id))
            return cursor.lastrowid
    except sqlite3.IntegrityError:
        logger.info(
            f"Interesse já existente (carga={carga_id}, motorista={motorista_id})."
        )
        return None


def obter_motoristas_da_carga(carga_id: int) -> list[dict]:
    """
    Lista os motoristas interessados numa carga, como dicts de resumo.

    Inclui o veículo principal (ativo, menor id) com nomes de tipo/carroceria.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_MOTORISTAS_POR_CARGA, (carga_id,))
        return [_row_to_motorista_resumo(row) for row in cursor.fetchall()]


def obter_cargas_do_motorista(
    motorista_id: int,
    status: Optional[StatusCarga] = None,
) -> list[Carga]:
    """
    Lista as cargas em que o motorista manifestou interesse.

    Filtro opcional por status da carga (enum StatusCarga ou None). Retorna
    dataclasses Carga; o agrupamento em interesse_enviado / contratadas /
    concluidas (cruzando status + motorista_escolhido_id) fica na rota.
    """
    status_valor = status.value if status is not None else None
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_CARGAS_POR_MOTORISTA, (
            motorista_id,
            status_valor,
            status_valor,
        ))
        return [_row_to_carga(row) for row in cursor.fetchall()]
