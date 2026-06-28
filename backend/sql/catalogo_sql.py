"""
SQL do catálogo de referência (tipos de veículo e carrocerias).

Tabelas de referência com seed fixo, usadas como FK por veiculo e carga.
"""

# =============================================================================
# Tipo de Veículo
# =============================================================================

CRIAR_TABELA_TIPO_VEICULO = """
CREATE TABLE IF NOT EXISTS tipo_veiculo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    ativo INTEGER NOT NULL DEFAULT 1
)
"""

INSERIR_TIPO_VEICULO = """
INSERT INTO tipo_veiculo (nome, ativo)
VALUES (?, ?)
"""

OBTER_ATIVOS_TIPO_VEICULO = """
SELECT id, nome, ativo
FROM tipo_veiculo
WHERE ativo = 1
ORDER BY id
"""
OBTER_TODOS_TIPO_VEICULO = """
SELECT id, nome, ativo
FROM tipo_veiculo
ORDER BY id
"""

OBTER_POR_ID_TIPO_VEICULO = """
SELECT id, nome, ativo
FROM tipo_veiculo
WHERE id = ?
"""
ATUALIZAR_TIPO_VEICULO = """
UPDATE tipo_veiculo
SET nome = ?
WHERE id = ?
"""

ATUALIZAR_ATIVO_TIPO_VEICULO = """
UPDATE tipo_veiculo
SET ativo = ?
WHERE id = ?
"""

EXISTE_NOME_TIPO_VEICULO = """
SELECT COUNT(*) as total
FROM tipo_veiculo
WHERE nome = ?
"""
EXISTE_NOME_TIPO_VEICULO_OUTRO_ID = """
SELECT COUNT(*) as total
FROM tipo_veiculo
WHERE nome = ? AND id <> ?
"""

CONTAR_TIPO_VEICULO = """
SELECT COUNT(*) as total
FROM tipo_veiculo
"""

# =============================================================================
# Tipo de Carroceria
# =============================================================================

CRIAR_TABELA_TIPO_CARROCERIA = """
CREATE TABLE IF NOT EXISTS tipo_carroceria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    ativo INTEGER NOT NULL DEFAULT 1
)
"""

INSERIR_TIPO_CARROCERIA = """
INSERT INTO tipo_carroceria (nome, ativo)
VALUES (?, ?)
"""

OBTER_ATIVOS_TIPO_CARROCERIA = """
SELECT id, nome, ativo
FROM tipo_carroceria
WHERE ativo = 1
ORDER BY id
"""
OBTER_TODOS_TIPO_CARROCERIA = """
SELECT id, nome, ativo
FROM tipo_carroceria
ORDER BY id
"""

OBTER_POR_ID_TIPO_CARROCERIA = """
SELECT id, nome, ativo
FROM tipo_carroceria
WHERE id = ?
"""
ATUALIZAR_TIPO_CARROCERIA = """
UPDATE tipo_carroceria
SET nome = ?
WHERE id = ?
"""
ATUALIZAR_ATIVO_TIPO_CARROCERIA = """
UPDATE tipo_carroceria
SET ativo = ?
WHERE id = ?
"""

EXISTE_NOME_TIPO_CARROCERIA = """
SELECT COUNT(*) as total
FROM tipo_carroceria
WHERE nome = ?
"""
EXISTE_NOME_TIPO_CARROCERIA_OUTRO_ID = """
SELECT COUNT(*) as total
FROM tipo_carroceria
WHERE nome = ? AND id <> ?
"""

CONTAR_TIPO_CARROCERIA = """
SELECT COUNT(*) as total
FROM tipo_carroceria
"""
