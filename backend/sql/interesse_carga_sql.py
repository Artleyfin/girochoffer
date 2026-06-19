"""
SQL puro do relacionamento N:N carga <-> motorista (interesse_carga).

UNIQUE(carga_id, motorista_id) garante idempotência de interesse.
FKs ON DELETE CASCADE: ao remover carga ou motorista, os interesses somem.

As leituras montam um "resumo de motorista" (dados de motorista + usuario +
veículo principal via catálogos) e um "resumo de carga do motorista" (cargas
em que o motorista manifestou interesse, com nomes via JOIN).
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS interesse_carga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL,
    motorista_id INTEGER NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (carga_id, motorista_id),
    FOREIGN KEY (carga_id) REFERENCES carga(id) ON DELETE CASCADE,
    FOREIGN KEY (motorista_id) REFERENCES motorista(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO interesse_carga (carga_id, motorista_id)
VALUES (?, ?)
"""

EXISTE = """
SELECT 1
FROM interesse_carga
WHERE carga_id = ? AND motorista_id = ?
LIMIT 1
"""

# Motoristas interessados numa carga, com dados de exibição (resumo).
# O veículo principal é o veículo ativo de menor id do motorista; seus
# nomes de tipo/carroceria vêm dos catálogos. Subquery escalar evita
# duplicar linhas quando o motorista tem vários veículos.
OBTER_MOTORISTAS_POR_CARGA = """
SELECT m.id AS motorista_id,
       u.nome AS nome,
       m.cidade AS cidade,
       m.nota AS nota,
       m.total_viagens AS total_viagens,
       m.foto_url AS foto_url,
       v.id AS veiculo_id,
       tv.nome AS veiculo_principal,
       tc.nome AS carroceria,
       v.capacidade_kg AS capacidade_kg,
       ic.data_criacao AS data_interesse
FROM interesse_carga ic
INNER JOIN motorista m ON ic.motorista_id = m.id
INNER JOIN usuario u ON m.usuario_id = u.id
LEFT JOIN veiculo v ON v.id = (
    SELECT v2.id FROM veiculo v2
    WHERE v2.motorista_id = m.id AND v2.ativo = 1
    ORDER BY v2.id
    LIMIT 1
)
LEFT JOIN tipo_veiculo tv ON v.tipo_veiculo_id = tv.id
LEFT JOIN tipo_carroceria tc ON v.tipo_carroceria_id = tc.id
WHERE ic.carga_id = ?
ORDER BY ic.data_criacao ASC
"""

# Cargas em que um motorista manifestou interesse, com nomes via JOIN e o
# agregado total_interesses. Filtro opcional por status da carga (no-op
# quando o parâmetro for None).
OBTER_CARGAS_POR_MOTORISTA = """
SELECT c.*,
       e.nome_fantasia AS empresa_nome,
       tv.nome AS tipo_veiculo_nome,
       tc.nome AS carroceria_nome,
       (SELECT COUNT(*) FROM interesse_carga ic2 WHERE ic2.carga_id = c.id)
           AS total_interesses
FROM interesse_carga ic
INNER JOIN carga c ON ic.carga_id = c.id
INNER JOIN empresa e ON c.empresa_id = e.id
INNER JOIN tipo_veiculo tv ON c.tipo_veiculo_id = tv.id
INNER JOIN tipo_carroceria tc ON c.tipo_carroceria_id = tc.id
WHERE ic.motorista_id = ?
  AND (? IS NULL OR c.status = ?)
ORDER BY c.data_publicacao DESC
"""

# NOTA: a query acima inclui a carga independentemente de o motorista ter sido
# o escolhido. A separação "interesse_enviado / contratadas / concluidas" é
# feita na camada de repo/rota cruzando status da carga com
# motorista_escolhido_id.
