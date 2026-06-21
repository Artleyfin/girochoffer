"""SQL do módulo Empresa (perfil Empresa, relação 1:1 com usuario)."""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS empresa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    telefone TEXT NOT NULL,
    whatsapp TEXT,
    foto_url TEXT,
    verificada INTEGER NOT NULL DEFAULT 0,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO empresa (
    usuario_id, cnpj, razao_social, nome_fantasia,
    telefone, whatsapp, foto_url, verificada, data_cadastro
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE empresa
SET cnpj = ?,
    razao_social = ?,
    nome_fantasia = ?,
    telefone = ?,
    whatsapp = ?,
    foto_url = ?
WHERE id = ?
"""

OBTER_POR_ID = """
SELECT e.*,
       u.nome     AS usuario_nome,
       u.email    AS usuario_email,
       u.telefone AS usuario_telefone,
       u.foto_url AS usuario_foto_url
FROM empresa e
INNER JOIN usuario u ON e.usuario_id = u.id
WHERE e.id = ?
"""

OBTER_POR_USUARIO_ID = """
SELECT e.*,
       u.nome     AS usuario_nome,
       u.email    AS usuario_email,
       u.telefone AS usuario_telefone,
       u.foto_url AS usuario_foto_url
FROM empresa e
INNER JOIN usuario u ON e.usuario_id = u.id
WHERE e.usuario_id = ?
"""
