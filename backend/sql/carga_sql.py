"""
SQL puro do módulo de cargas (fretes).

Todas as queries usam prepared statements (placeholders ?). As leituras
fazem JOIN com empresa e com os catálogos (tipo_veiculo, tipo_carroceria)
para trazer os nomes legíveis, e uma subquery COUNT em interesse_carga para
o agregado total_interesses (usado para derivar o rótulo "Com interessados").
"""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS carga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    tipo_veiculo_id INTEGER NOT NULL,
    tipo_carroceria_id INTEGER NOT NULL,
    peso_kg INTEGER,
    volume_m3 REAL,
    valor_frete REAL NOT NULL,
    data_coleta TEXT,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Disponível',
    foto_url TEXT,
    motorista_escolhido_id INTEGER,
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_veiculo_id) REFERENCES tipo_veiculo(id),
    FOREIGN KEY (tipo_carroceria_id) REFERENCES tipo_carroceria(id),
    FOREIGN KEY (motorista_escolhido_id) REFERENCES motorista(id) ON DELETE SET NULL
)
"""

# Bloco SELECT reutilizável: traz colunas da carga + nomes via JOIN +
# total_interesses via subquery correlacionada. Reutilizado nas leituras.
_SELECT_BASE = """
SELECT c.*,
       e.nome_fantasia AS empresa_nome,
       tv.nome AS tipo_veiculo_nome,
       tc.nome AS carroceria_nome,
       (SELECT COUNT(*) FROM interesse_carga ic WHERE ic.carga_id = c.id)
           AS total_interesses
FROM carga c
INNER JOIN empresa e ON c.empresa_id = e.id
INNER JOIN tipo_veiculo tv ON c.tipo_veiculo_id = tv.id
INNER JOIN tipo_carroceria tc ON c.tipo_carroceria_id = tc.id
"""

INSERIR = """
INSERT INTO carga (
    empresa_id, titulo, origem, destino, tipo_veiculo_id, tipo_carroceria_id,
    peso_kg, volume_m3, valor_frete, data_coleta, descricao, status, foto_url
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE carga
SET titulo = ?,
    origem = ?,
    destino = ?,
    tipo_veiculo_id = ?,
    tipo_carroceria_id = ?,
    peso_kg = ?,
    volume_m3 = ?,
    valor_frete = ?,
    data_coleta = ?,
    descricao = ?,
    foto_url = ?,
    data_atualizacao = ?
WHERE id = ?
"""

ATUALIZAR_STATUS = """
UPDATE carga
SET status = ?, data_atualizacao = ?
WHERE id = ?
"""

ESCOLHER_MOTORISTA = """
UPDATE carga
SET motorista_escolhido_id = ?, status = ?, data_atualizacao = ?
WHERE id = ?
"""

OBTER_POR_ID = _SELECT_BASE + " WHERE c.id = ?"

# Cargas de uma empresa. O filtro de status é opcional: quando não informado
# o segundo parâmetro deve ser None (cláusula vira no-op via OR ? IS NULL).
OBTER_POR_EMPRESA = _SELECT_BASE + """
WHERE c.empresa_id = ?
  AND (? IS NULL OR c.status = ?)
ORDER BY c.data_publicacao DESC
"""

# Cargas disponíveis (vitrine do motorista). Filtros opcionais de origem,
# destino (LIKE) e tipo_carroceria_id; cada um é no-op quando o parâmetro
# correspondente for None.
OBTER_DISPONIVEIS = _SELECT_BASE + """
WHERE c.status = 'Disponível'
  AND (? IS NULL OR c.origem LIKE ?)
  AND (? IS NULL OR c.destino LIKE ?)
  AND (? IS NULL OR c.tipo_carroceria_id = ?)
ORDER BY c.data_publicacao DESC
"""

CONTAR_POR_EMPRESA = """
SELECT COUNT(*) AS total
FROM carga
WHERE empresa_id = ?
  AND (? IS NULL OR status = ?)
"""

CONTAR_DISPONIVEIS = """
SELECT COUNT(*) AS total
FROM carga
WHERE status = 'Disponível'
  AND (? IS NULL OR origem LIKE ?)
  AND (? IS NULL OR destino LIKE ?)
  AND (? IS NULL OR tipo_carroceria_id = ?)
"""
