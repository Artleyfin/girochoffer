"""
SQL puro da tabela de avaliações (avaliacao).

Uma avaliação por carga (carga_id UNIQUE): a empresa avalia o motorista que fez
o frete, apenas depois de a carga estar Concluída. O CHECK garante a nota no
intervalo 1..5 também no nível do banco.

FKs ON DELETE CASCADE: ao remover a carga, a empresa ou o motorista, a avaliação
some junto. A leitura por motorista faz JOIN com empresa/carga para exibição.
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS avaliacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL UNIQUE,
    empresa_id INTEGER NOT NULL,
    motorista_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carga_id) REFERENCES carga(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (motorista_id) REFERENCES motorista(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO avaliacao (carga_id, empresa_id, motorista_id, nota, comentario, data)
VALUES (?, ?, ?, ?, ?, ?)
"""

EXISTE_POR_CARGA = """
SELECT 1
FROM avaliacao
WHERE carga_id = ?
LIMIT 1
"""

# Média das notas de um motorista (None se ele ainda não tem avaliações).
MEDIA_POR_MOTORISTA = """
SELECT AVG(nota) AS media
FROM avaliacao
WHERE motorista_id = ?
"""

# Avaliações recebidas por um motorista, mais recentes primeiro, com o nome da
# empresa e o título da carga para exibição.
OBTER_POR_MOTORISTA = """
SELECT a.id AS id,
       a.carga_id AS carga_id,
       a.empresa_id AS empresa_id,
       a.motorista_id AS motorista_id,
       a.nota AS nota,
       a.comentario AS comentario,
       a.data AS data,
       e.nome_fantasia AS empresa_nome,
       c.titulo AS carga_titulo
FROM avaliacao a
INNER JOIN empresa e ON a.empresa_id = e.id
INNER JOIN carga c ON a.carga_id = c.id
WHERE a.motorista_id = ?
ORDER BY a.data DESC
"""
