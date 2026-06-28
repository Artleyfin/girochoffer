"""
SQL puro do relacionamento N:N empresa <-> motorista (favorito_motorista).

UNIQUE(empresa_id, motorista_id) garante idempotência do favorito (uma empresa
não favorita o mesmo motorista duas vezes). FKs ON DELETE CASCADE: ao remover a
empresa ou o motorista, os favoritos somem.

A leitura monta um "resumo de motorista" (dados do motorista + usuario + veículo
principal via catálogos), no mesmo formato usado por interesse_carga.
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS favorito_motorista (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    motorista_id INTEGER NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (empresa_id, motorista_id),
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (motorista_id) REFERENCES motorista(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO favorito_motorista (empresa_id, motorista_id)
VALUES (?, ?)
"""

EXISTE = """
SELECT 1
FROM favorito_motorista
WHERE empresa_id = ? AND motorista_id = ?
LIMIT 1
"""

REMOVER = """
DELETE FROM favorito_motorista
WHERE empresa_id = ? AND motorista_id = ?
"""

# Motoristas favoritados por uma empresa, com dados de exibição (resumo).
# O veículo principal é o veículo ativo de menor id do motorista; seus nomes de
# tipo/carroceria vêm dos catálogos. Subquery escalar evita duplicar linhas.
OBTER_MOTORISTAS_POR_EMPRESA = """
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
       fm.data_criacao AS data_favorito
FROM favorito_motorista fm
INNER JOIN motorista m ON fm.motorista_id = m.id
INNER JOIN usuario u ON m.usuario_id = u.id
LEFT JOIN veiculo v ON v.id = (
    SELECT v2.id FROM veiculo v2
    WHERE v2.motorista_id = m.id AND v2.ativo = 1
    ORDER BY v2.id
    LIMIT 1
)
LEFT JOIN tipo_veiculo tv ON v.tipo_veiculo_id = tv.id
LEFT JOIN tipo_carroceria tc ON v.tipo_carroceria_id = tc.id
WHERE fm.empresa_id = ?
ORDER BY fm.data_criacao DESC
"""