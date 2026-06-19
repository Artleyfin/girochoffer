"""
Repositório de Cargas (fretes).

Camada de acesso a dados sobre a tabela `carga`. SQL puro com prepared
statements; nenhuma regra de negócio aqui além da conversão segura de status
e da montagem da dataclass a partir do `sqlite3.Row` (que já traz os campos
derivados empresa_nome, tipo_veiculo_nome, carroceria_nome e total_interesses
via JOIN/subquery no SQL).

Padrões seguidos: obter_conexao() (util.db_util), agora() (util.datetime_util)
para timestamps, e _converter_status_seguro espelhando o _converter_enum_seguro
do chamado_repo.
"""

import sqlite3
from typing import Optional

from model.carga_model import Carga, StatusCarga
from sql.carga_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    ATUALIZAR_STATUS,
    ESCOLHER_MOTORISTA,
    OBTER_POR_ID,
    OBTER_POR_EMPRESA,
    OBTER_DISPONIVEIS,
    CONTAR_POR_EMPRESA,
    CONTAR_DISPONIVEIS,
)
from util.db_util import obter_conexao
from util.datetime_util import agora
from util.logger_config import logger


def _converter_status_seguro(valor: str) -> StatusCarga:
    """
    Converte string do banco em StatusCarga de forma segura.

    Em caso de valor inválido, registra erro e retorna DISPONIVEL como padrão
    (mesma filosofia defensiva do _converter_enum_seguro do chamado_repo).
    """
    try:
        return StatusCarga(valor)
    except ValueError:
        logger.error(
            f"Valor inválido para StatusCarga: '{valor}'. "
            f"Usando padrão: {StatusCarga.DISPONIVEL.value}"
        )
        return StatusCarga.DISPONIVEL


def _coluna(row: sqlite3.Row, nome: str):
    """Lê uma coluna do row de forma tolerante (None se ausente)."""
    return row[nome] if nome in row.keys() else None


def _row_to_carga(row: sqlite3.Row) -> Carga:
    """Converte sqlite3.Row em dataclass Carga, incluindo campos derivados."""
    return Carga(
        id=row["id"],
        empresa_id=row["empresa_id"],
        titulo=row["titulo"],
        origem=row["origem"],
        destino=row["destino"],
        tipo_veiculo_id=row["tipo_veiculo_id"],
        tipo_carroceria_id=row["tipo_carroceria_id"],
        valor_frete=row["valor_frete"],
        descricao=row["descricao"],
        status=_converter_status_seguro(row["status"]),
        peso_kg=row["peso_kg"],
        volume_m3=row["volume_m3"],
        data_coleta=row["data_coleta"],
        foto_url=row["foto_url"],
        motorista_escolhido_id=row["motorista_escolhido_id"],
        data_publicacao=row["data_publicacao"],
        data_atualizacao=row["data_atualizacao"],
        total_interesses=_coluna(row, "total_interesses") or 0,
        empresa_nome=_coluna(row, "empresa_nome"),
        tipo_veiculo_nome=_coluna(row, "tipo_veiculo_nome"),
        carroceria_nome=_coluna(row, "carroceria_nome"),
    )


def criar_tabela() -> bool:
    """Cria a tabela de cargas se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(carga: Carga) -> Optional[int]:
    """
    Insere uma nova carga. O status é gravado a partir do enum da dataclass
    (deve ser DISPONIVEL na criação). Retorna o id gerado.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            carga.empresa_id,
            carga.titulo,
            carga.origem,
            carga.destino,
            carga.tipo_veiculo_id,
            carga.tipo_carroceria_id,
            carga.peso_kg,
            carga.volume_m3,
            carga.valor_frete,
            carga.data_coleta,
            carga.descricao,
            carga.status.value,
            carga.foto_url,
        ))
        return cursor.lastrowid


def atualizar(carga: Carga) -> bool:
    """Atualiza os campos editáveis de uma carga existente."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (
            carga.titulo,
            carga.origem,
            carga.destino,
            carga.tipo_veiculo_id,
            carga.tipo_carroceria_id,
            carga.peso_kg,
            carga.volume_m3,
            carga.valor_frete,
            carga.data_coleta,
            carga.descricao,
            carga.foto_url,
            agora(),
            carga.id,
        ))
        return cursor.rowcount > 0


def definir_status(carga_id: int, status: StatusCarga) -> bool:
    """Altera o status de uma carga (ex: Concluída, Cancelada)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR_STATUS, (
            status.value,
            agora(),
            carga_id,
        ))
        return cursor.rowcount > 0


def escolher_motorista(carga_id: int, motorista_id: int) -> bool:
    """
    Define o motorista escolhido e move a carga para Contratada.

    A verificação de que o motorista está entre os interessados é
    responsabilidade da camada de rota/serviço (B5), não do repo.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ESCOLHER_MOTORISTA, (
            motorista_id,
            StatusCarga.CONTRATADA.value,
            agora(),
            carga_id,
        ))
        return cursor.rowcount > 0


def obter_por_id(carga_id: int) -> Optional[Carga]:
    """Obtém uma carga por id, com nomes via JOIN e total_interesses."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (carga_id,))
        row = cursor.fetchone()
        return _row_to_carga(row) if row else None


def obter_por_empresa(
    empresa_id: int,
    status: Optional[StatusCarga] = None,
) -> list[Carga]:
    """
    Lista as cargas de uma empresa, opcionalmente filtrando por status.

    O filtro de status aceita o enum StatusCarga ou None (sem filtro).
    """
    status_valor = status.value if status is not None else None
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_EMPRESA, (
            empresa_id,
            status_valor,
            status_valor,
        ))
        return [_row_to_carga(row) for row in cursor.fetchall()]


def obter_disponiveis(
    origem: Optional[str] = None,
    destino: Optional[str] = None,
    carroceria_id: Optional[int] = None,
) -> list[Carga]:
    """
    Lista cargas com status Disponível, aplicando filtros opcionais.

    origem/destino são casados por LIKE (contém, case-insensitive no SQLite
    para ASCII); carroceria_id é igualdade exata. Qualquer filtro None é
    ignorado.
    """
    origem_like = f"%{origem.strip()}%" if origem and origem.strip() else None
    destino_like = f"%{destino.strip()}%" if destino and destino.strip() else None
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_DISPONIVEIS, (
            origem_like, origem_like,
            destino_like, destino_like,
            carroceria_id, carroceria_id,
        ))
        return [_row_to_carga(row) for row in cursor.fetchall()]


def contar_por_empresa(
    empresa_id: int,
    status: Optional[StatusCarga] = None,
) -> int:
    """Conta as cargas de uma empresa (opcionalmente por status)."""
    status_valor = status.value if status is not None else None
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CONTAR_POR_EMPRESA, (
            empresa_id,
            status_valor,
            status_valor,
        ))
        row = cursor.fetchone()
        return row["total"] if row else 0


def contar_disponiveis(
    origem: Optional[str] = None,
    destino: Optional[str] = None,
    carroceria_id: Optional[int] = None,
) -> int:
    """Conta as cargas disponíveis aplicando os mesmos filtros de listagem."""
    origem_like = f"%{origem.strip()}%" if origem and origem.strip() else None
    destino_like = f"%{destino.strip()}%" if destino and destino.strip() else None
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CONTAR_DISPONIVEIS, (
            origem_like, origem_like,
            destino_like, destino_like,
            carroceria_id, carroceria_id,
        ))
        row = cursor.fetchone()
        return row["total"] if row else 0
