"""
Repositório de Veículos (GiroChoffer).

Veículo pertence a um motorista (1:N). As leituras fazem JOIN com os catálogos
``tipo_veiculo`` / ``tipo_carroceria`` para popular ``tipo_veiculo_nome`` e
``carroceria_nome`` na dataclass ``Veiculo`` (apenas exibição).

A criação da tabela depende de ``motorista`` e dos catálogos já existirem
(garantido pela ordem de registro em ``main.py``).
"""

import sqlite3
from typing import Optional

from model.veiculo_model import Veiculo
from sql.veiculo_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    OBTER_POR_ID,
    OBTER_POR_MOTORISTA,
    OBTER_PRINCIPAL_POR_MOTORISTA,
    EXCLUIR,
)
from util.db_util import obter_conexao


def _row_to_veiculo(row: sqlite3.Row) -> Veiculo:
    """Converte sqlite3.Row em dataclass Veiculo (com nomes do JOIN)."""
    chaves = row.keys()
    return Veiculo(
        id=row["id"],
        motorista_id=row["motorista_id"],
        tipo_veiculo_id=row["tipo_veiculo_id"],
        tipo_carroceria_id=row["tipo_carroceria_id"],
        placa=row["placa"],
        capacidade_kg=row["capacidade_kg"],
        ativo=bool(row["ativo"]),
        data_cadastro=row["data_cadastro"],
        tipo_veiculo_nome=(
            row["tipo_veiculo_nome"] if "tipo_veiculo_nome" in chaves else None
        ),
        carroceria_nome=(
            row["carroceria_nome"] if "carroceria_nome" in chaves else None
        ),
    )


def criar_tabela() -> bool:
    """Cria a tabela de veículos se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(veiculo: Veiculo) -> Optional[int]:
    """Insere um novo veículo e retorna o id gerado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            veiculo.motorista_id,
            veiculo.tipo_veiculo_id,
            veiculo.tipo_carroceria_id,
            veiculo.placa,
            veiculo.capacidade_kg,
            1 if veiculo.ativo else 0,
        ))
        return cursor.lastrowid


def atualizar(veiculo: Veiculo) -> bool:
    """Atualiza os dados de um veículo existente."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (
            veiculo.tipo_veiculo_id,
            veiculo.tipo_carroceria_id,
            veiculo.placa,
            veiculo.capacidade_kg,
            1 if veiculo.ativo else 0,
            veiculo.id,
        ))
        return cursor.rowcount > 0


def obter_por_id(id: int) -> Optional[Veiculo]:
    """Retorna um veículo pelo id (com nomes de catálogo) ou None."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        return _row_to_veiculo(row) if row else None


def obter_por_motorista(motorista_id: int) -> list[Veiculo]:
    """Retorna todos os veículos de um motorista (ativos primeiro)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_MOTORISTA, (motorista_id,))
        return [_row_to_veiculo(row) for row in cursor.fetchall()]


def obter_principal(motorista_id: int) -> Optional[Veiculo]:
    """Retorna o veículo principal (mais antigo) do motorista ou None."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_PRINCIPAL_POR_MOTORISTA, (motorista_id,))
        row = cursor.fetchone()
        return _row_to_veiculo(row) if row else None


def excluir(id: int) -> bool:
    """Exclui um veículo pelo id."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXCLUIR, (id,))
        return cursor.rowcount > 0
