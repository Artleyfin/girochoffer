"""Repositório de Empresas (perfil Empresa, relação 1:1 com usuario).

SQL puro com prepared statements (sem ORM). As consultas de leitura fazem
JOIN com a tabela usuario para trazer nome/email/telefone/foto do usuário
associado; ``_row_to_empresa`` trata essas colunas de forma defensiva
(``if col in row.keys()``) para também funcionar com rows sem o JOIN.
"""

import sqlite3
from typing import Optional

from model.empresa_model import Empresa
from sql.empresa_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    OBTER_POR_ID,
    OBTER_POR_USUARIO_ID,
)
from util.db_util import obter_conexao
from util.datetime_util import agora


def _row_to_empresa(row: sqlite3.Row) -> Empresa:
    """Converte sqlite3.Row em dataclass Empresa, tratando colunas de JOIN."""
    colunas = row.keys()
    return Empresa(
        id=row["id"],
        usuario_id=row["usuario_id"],
        cnpj=row["cnpj"],
        razao_social=row["razao_social"],
        nome_fantasia=row["nome_fantasia"],
        telefone=row["telefone"],
        whatsapp=row["whatsapp"] if "whatsapp" in colunas else None,
        foto_url=row["foto_url"] if "foto_url" in colunas else None,
        verificada=bool(row["verificada"]) if "verificada" in colunas else False,
        data_cadastro=row["data_cadastro"] if "data_cadastro" in colunas else None,
        usuario_nome=row["usuario_nome"] if "usuario_nome" in colunas else None,
        usuario_email=row["usuario_email"] if "usuario_email" in colunas else None,
        usuario_telefone=(
            row["usuario_telefone"] if "usuario_telefone" in colunas else None
        ),
        usuario_foto_url=(
            row["usuario_foto_url"] if "usuario_foto_url" in colunas else None
        ),
    )


def criar_tabela() -> bool:
    """Cria a tabela empresa se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(empresa: Empresa) -> Optional[int]:
    """Insere uma nova empresa e retorna o id gerado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            empresa.usuario_id,
            empresa.cnpj,
            empresa.razao_social,
            empresa.nome_fantasia,
            empresa.telefone,
            empresa.whatsapp,
            empresa.foto_url,
            1 if empresa.verificada else 0,
            empresa.data_cadastro or agora(),
        ))
        return cursor.lastrowid


def atualizar(empresa: Empresa) -> bool:
    """Atualiza os dados editáveis da empresa. Retorna True se afetou linha."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (
            empresa.cnpj,
            empresa.razao_social,
            empresa.nome_fantasia,
            empresa.telefone,
            empresa.whatsapp,
            empresa.foto_url,
            empresa.id,
        ))
        return cursor.rowcount > 0


def obter_por_id(id: int) -> Optional[Empresa]:
    """Obtém uma empresa pelo id (com dados do usuário via JOIN)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        return _row_to_empresa(row) if row else None


def obter_por_usuario_id(usuario_id: int) -> Optional[Empresa]:
    """Obtém a empresa associada a um usuário (relação 1:1)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_USUARIO_ID, (usuario_id,))
        row = cursor.fetchone()
        return _row_to_empresa(row) if row else None
