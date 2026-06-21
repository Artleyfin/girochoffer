"""SQL do módulo de Veículos (GiroChoffer).

A tabela ``veiculo`` referencia ``motorista`` (1:N) e os catálogos
``tipo_veiculo`` / ``tipo_carroceria`` (criados por ``catalogo_repo``).
Por isso ``motorista`` e os catálogos devem ser criados ANTES desta tabela
(ver ordem de criação em ``main.py``).
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS veiculo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    motorista_id INTEGER NOT NULL,
    tipo_veiculo_id INTEGER NOT NULL,
    tipo_carroceria_id INTEGER NOT NULL,
    placa TEXT NOT NULL,
    capacidade_kg INTEGER NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motorista(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_veiculo_id) REFERENCES tipo_veiculo(id),
    FOREIGN KEY (tipo_carroceria_id) REFERENCES tipo_carroceria(id)
)
"""

INSERIR = """
INSERT INTO veiculo (
    motorista_id, tipo_veiculo_id, tipo_carroceria_id,
    placa, capacidade_kg, ativo
)
VALUES (?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE veiculo
SET tipo_veiculo_id = ?,
    tipo_carroceria_id = ?,
    placa = ?,
    capacidade_kg = ?,
    ativo = ?
WHERE id = ?
"""

# Seleção com JOIN nos catálogos para trazer os nomes legíveis.
_SELECT_BASE = """
SELECT v.*,
       tv.nome AS tipo_veiculo_nome,
       tc.nome AS carroceria_nome
FROM veiculo v
INNER JOIN tipo_veiculo tv ON v.tipo_veiculo_id = tv.id
INNER JOIN tipo_carroceria tc ON v.tipo_carroceria_id = tc.id
"""

OBTER_POR_ID = _SELECT_BASE + " WHERE v.id = ?"

OBTER_POR_MOTORISTA = (
    _SELECT_BASE
    + " WHERE v.motorista_id = ? ORDER BY v.ativo DESC, v.id ASC"
)

# Primeiro veículo (principal) de um motorista — o mais antigo cadastrado.
OBTER_PRINCIPAL_POR_MOTORISTA = (
    _SELECT_BASE
    + " WHERE v.motorista_id = ? ORDER BY v.id ASC LIMIT 1"
)

EXCLUIR = "DELETE FROM veiculo WHERE id = ?"
