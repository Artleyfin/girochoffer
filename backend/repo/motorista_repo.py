"""
Repositório de Motoristas (GiroChoffer).

Motorista tem relação 1:1 com Usuario (via ``usuario_id`` UNIQUE) e 1:N com
Veiculo. As leituras fazem JOIN com ``usuario`` para popular ``nome`` e
``email``. ``obter_detalhe`` carrega adicionalmente a lista de veículos
(via lazy import de ``veiculo_repo`` para evitar import circular).

A criação da tabela depende de ``usuario`` já existir (garantido pela ordem
de registro em ``main.py``).
"""

import sqlite3
from typing import Optional

from model.motorista_model import Motorista
from sql.motorista_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    OBTER_POR_ID,
    OBTER_POR_USUARIO_ID,
)
from util.db_util import obter_conexao


def _row_to_motorista(row: sqlite3.Row) -> Motorista:
    """Converte sqlite3.Row em dataclass Motorista (com nome/email do JOIN)."""
    chaves = row.keys()
    return Motorista(
        id=row["id"],
        usuario_id=row["usuario_id"],
        cpf=row["cpf"],
        telefone=row["telefone"],
        cidade=row["cidade"],
        nota=row["nota"],
        total_viagens=row["total_viagens"],
        foto_url=row["foto_url"],
        verificado=bool(row["verificado"]),
        data_cadastro=row["data_cadastro"],
        nome=row["nome"] if "nome" in chaves else None,
        email=row["email"] if "email" in chaves else None,
    )


def criar_tabela() -> bool:
    """Cria a tabela de motoristas se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(motorista: Motorista) -> Optional[int]:
    """Insere um novo motorista e retorna o id gerado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            motorista.usuario_id,
            motorista.cpf,
            motorista.telefone,
            motorista.cidade,
            motorista.nota,
            motorista.total_viagens,
            motorista.foto_url,
            1 if motorista.verificado else 0,
        ))
        return cursor.lastrowid


def atualizar(motorista: Motorista) -> bool:
    """Atualiza dados pessoais editáveis de um motorista (cpf, telefone, cidade, foto)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (
            motorista.cpf,
            motorista.telefone,
            motorista.cidade,
            motorista.foto_url,
            motorista.id,
        ))
        return cursor.rowcount > 0


def obter_por_id(id: int) -> Optional[Motorista]:
    """Retorna um motorista pelo id (sem veículos) ou None."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        return _row_to_motorista(row) if row else None


def obter_por_usuario_id(usuario_id: int) -> Optional[Motorista]:
    """Retorna o motorista vinculado a um usuário (1:1) ou None."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_USUARIO_ID, (usuario_id,))
        row = cursor.fetchone()
        return _row_to_motorista(row) if row else None


def obter_detalhe(id: int) -> Optional[Motorista]:
    """
    Retorna o motorista pelo id já com a lista de veículos carregada.

    Usa lazy import de ``veiculo_repo`` para evitar dependência circular
    no momento da importação dos módulos.
    """
    from repo import veiculo_repo

    motorista = obter_por_id(id)
    if motorista is None:
        return None
    motorista.veiculos = veiculo_repo.obter_por_motorista(motorista.id)
    return motorista
