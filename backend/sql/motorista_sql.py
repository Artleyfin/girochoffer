"""SQL do módulo de Motoristas (GiroChoffer).

A tabela ``motorista`` tem relação 1:1 com ``usuario`` (via ``usuario_id``
UNIQUE) e deve ser criada APÓS ``usuario`` (ver ordem em ``main.py``).
As leituras fazem JOIN com ``usuario`` para trazer nome e e-mail.
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS motorista (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    cpf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    cidade TEXT,
    nota REAL NOT NULL DEFAULT 0.0,
    total_viagens INTEGER NOT NULL DEFAULT 0,
    foto_url TEXT,
    verificado INTEGER NOT NULL DEFAULT 0,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO motorista (
    usuario_id, cpf, telefone, cidade, nota,
    total_viagens, foto_url, verificado
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE motorista
SET cpf = ?,
    telefone = ?,
    cidade = ?,
    foto_url = ?
WHERE id = ?
"""

_SELECT_BASE = """
SELECT m.*,
       u.nome AS nome,
       u.email AS email
FROM motorista m
INNER JOIN usuario u ON m.usuario_id = u.id
"""

OBTER_POR_ID = _SELECT_BASE + " WHERE m.id = ?"

OBTER_POR_USUARIO_ID = _SELECT_BASE + " WHERE m.usuario_id = ?"
