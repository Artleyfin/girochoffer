"""
Repositório do catálogo de referência (tipos de veículo e carrocerias).

Gerencia as duas tabelas de referência usadas como FK por veiculo e carga.
A criação das tabelas e o seed inicial ficam centralizados aqui — registre
``criar_tabela()`` (e ``seed_inicial()``) uma única vez em ``main.py``.

Uso:
    from repo import catalogo_repo
    catalogo_repo.criar_tabela()
    catalogo_repo.seed_inicial()
    tipos = catalogo_repo.obter_tipos_veiculo_ativos()
    carrocerias = catalogo_repo.obter_carrocerias_ativas()
"""

import sqlite3
from typing import Optional

from model.catalogo_model import TipoVeiculo, TipoCarroceria
from sql.catalogo_sql import (
    CRIAR_TABELA_TIPO_VEICULO,
    CRIAR_TABELA_TIPO_CARROCERIA,
    INSERIR_TIPO_VEICULO,
    INSERIR_TIPO_CARROCERIA,
    OBTER_ATIVOS_TIPO_VEICULO,
    OBTER_ATIVOS_TIPO_CARROCERIA,
    OBTER_POR_ID_TIPO_VEICULO,
    OBTER_POR_ID_TIPO_CARROCERIA,
    EXISTE_NOME_TIPO_VEICULO,
    EXISTE_NOME_TIPO_CARROCERIA,
    CONTAR_TIPO_VEICULO,
    CONTAR_TIPO_CARROCERIA,
)
from util.db_util import obter_conexao
from util.logger_config import logger

# Seed fixo (acentuação UTF-8 correta) conforme contrato canônico.
SEED_TIPOS_VEICULO = ["Caminhão", "Carreta", "Bitrem", "VUC", "Van"]
SEED_TIPOS_CARROCERIA = [
    "Baú",
    "Sider",
    "Graneleiro",
    "Refrigerado",
    "Aberto/Prancha",
    "Tanque",
]


def _row_to_tipo_veiculo(row: sqlite3.Row) -> TipoVeiculo:
    """Converte sqlite3.Row em dataclass TipoVeiculo."""
    return TipoVeiculo(
        id=row["id"],
        nome=row["nome"],
        ativo=bool(row["ativo"]),
    )


def _row_to_tipo_carroceria(row: sqlite3.Row) -> TipoCarroceria:
    """Converte sqlite3.Row em dataclass TipoCarroceria."""
    return TipoCarroceria(
        id=row["id"],
        nome=row["nome"],
        ativo=bool(row["ativo"]),
    )


def criar_tabela() -> bool:
    """Cria AS DUAS tabelas de catálogo (tipo_veiculo e tipo_carroceria)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA_TIPO_VEICULO)
        cursor.execute(CRIAR_TABELA_TIPO_CARROCERIA)
        return True


# =============================================================================
# Inserção
# =============================================================================

def inserir_tipo_veiculo(nome: str, ativo: bool = True) -> Optional[int]:
    """Insere um tipo de veículo. Retorna o ID criado ou None em caso de erro."""
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(INSERIR_TIPO_VEICULO, (nome, 1 if ativo else 0))
            return cursor.lastrowid
    except sqlite3.Error as e:
        logger.error(f"Erro ao inserir tipo de veículo '{nome}': {e}")
        return None


def inserir_tipo_carroceria(nome: str, ativo: bool = True) -> Optional[int]:
    """Insere um tipo de carroceria. Retorna o ID criado ou None em caso de erro."""
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(INSERIR_TIPO_CARROCERIA, (nome, 1 if ativo else 0))
            return cursor.lastrowid
    except sqlite3.Error as e:
        logger.error(f"Erro ao inserir tipo de carroceria '{nome}': {e}")
        return None


# =============================================================================
# Consultas
# =============================================================================

def obter_tipos_veiculo_ativos() -> list[TipoVeiculo]:
    """Retorna todos os tipos de veículo ativos (ordenados por id)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_ATIVOS_TIPO_VEICULO)
        return [_row_to_tipo_veiculo(row) for row in cursor.fetchall()]


def obter_carrocerias_ativas() -> list[TipoCarroceria]:
    """Retorna todos os tipos de carroceria ativos (ordenados por id)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_ATIVOS_TIPO_CARROCERIA)
        return [_row_to_tipo_carroceria(row) for row in cursor.fetchall()]


def obter_tipo_veiculo(tipo_veiculo_id: int) -> Optional[TipoVeiculo]:
    """Retorna um tipo de veículo pelo ID, ou None se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID_TIPO_VEICULO, (tipo_veiculo_id,))
        row = cursor.fetchone()
        return _row_to_tipo_veiculo(row) if row else None


def obter_carroceria(tipo_carroceria_id: int) -> Optional[TipoCarroceria]:
    """Retorna um tipo de carroceria pelo ID, ou None se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID_TIPO_CARROCERIA, (tipo_carroceria_id,))
        row = cursor.fetchone()
        return _row_to_tipo_carroceria(row) if row else None


def existe_nome_tipo_veiculo(nome: str) -> bool:
    """Verifica se já existe um tipo de veículo com o nome informado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE_NOME_TIPO_VEICULO, (nome,))
        row = cursor.fetchone()
        return (row["total"] if row else 0) > 0


def existe_nome_carroceria(nome: str) -> bool:
    """Verifica se já existe um tipo de carroceria com o nome informado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE_NOME_TIPO_CARROCERIA, (nome,))
        row = cursor.fetchone()
        return (row["total"] if row else 0) > 0


# =============================================================================
# Seed inicial (idempotente)
# =============================================================================

def seed_inicial() -> None:
    """
    Insere a lista fixa de tipos de veículo e carrocerias se as tabelas
    estiverem vazias. Idempotente: não duplica em execuções repetidas.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()

        cursor.execute(CONTAR_TIPO_VEICULO)
        total_veiculos = cursor.fetchone()["total"]
        if total_veiculos == 0:
            for nome in SEED_TIPOS_VEICULO:
                cursor.execute(INSERIR_TIPO_VEICULO, (nome, 1))
            logger.info(
                f"Seed catálogo: {len(SEED_TIPOS_VEICULO)} tipos de veículo inseridos."
            )

        cursor.execute(CONTAR_TIPO_CARROCERIA)
        total_carrocerias = cursor.fetchone()["total"]
        if total_carrocerias == 0:
            for nome in SEED_TIPOS_CARROCERIA:
                cursor.execute(INSERIR_TIPO_CARROCERIA, (nome, 1))
            logger.info(
                f"Seed catálogo: {len(SEED_TIPOS_CARROCERIA)} tipos de carroceria inseridos."
            )
