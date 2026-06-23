# Tutorial: Empresa favoritar motoristas + Avaliar motorista pós-frete

Este tutorial ensina, passo a passo, do banco de dados até a tela, como implementar **duas funcionalidades** no projeto GiroChoffer. Ele foi escrito para quem está começando. Não pule nenhuma etapa: faça exatamente na ordem indicada, copiando os códigos e prestando atenção nas explicações.

---

## O que você vai construir

Você vai adicionar duas funcionalidades novas ao GiroChoffer, ambas "full-stack" (mexem no backend **e** no frontend):

**(A) Empresa favorita motoristas.** A empresa logada pode marcar um motorista como favorito (a partir do card do motorista interessado), desmarcar, e ver uma página com a lista dos seus motoristas favoritos.

**(B) Avaliar motorista pós-frete.** Depois que uma carga é **Concluída**, a empresa dá uma nota de 1 a 5 (com comentário) ao motorista que fez o frete. A nota recalcula a média (`motorista.nota`). O motorista pode listar as avaliações que recebeu, e a média aparece no card do motorista.

Resultado final esperado:

- Tabela nova `favorito_motorista` (relacionamento N:N empresa↔motorista, idempotente, igual ao padrão de `interesse_carga`).
- Tabela nova `avaliacao` (uma avaliação por carga, com `carga_id` único).
- Rotas backend: `POST/DELETE/GET /empresa/favoritos`, `POST /empresa/cargas/{id}/avaliar`, `GET /motorista/avaliacoes`.
- Recálculo automático de `motorista.nota` a cada nova avaliação.
- Frontend: botão "Favoritar" no card do motorista, nova página `EmpresaFavoritosPage`, item de menu novo, e a média de avaliação exibida no card.

---

## Pré-requisitos

Antes de programar, garanta que o projeto **roda** na sua máquina. Abra dois terminais.

**Terminal 1 — Backend** (a partir da raiz do projeto):

```bash
backend/.venv/bin/python backend/main.py
```

> Atenção: use SEMPRE o Python do `.venv` (o `.python-version` aponta para uma versão que pode não estar instalada). O backend sobe na porta `8412`. A documentação interativa fica em `http://127.0.0.1:8412/docs`.

**Terminal 2 — Frontend** (a partir da pasta `frontend/`):

```bash
cd frontend
npm install      # só na primeira vez
npm run dev
```

> O Vite sobe na porta `5182` e faz proxy de `/api` para o backend. Abra `http://127.0.0.1:5182`.

Para testar, entre com um usuário de demonstração (a senha padrão do seed é `1234aA@#`). Há empresas e motoristas já cadastrados. Confirme que você consegue logar como **empresa**, ver o painel, e logar como **motorista**.

Comandos úteis durante o desenvolvimento:

```bash
backend/.venv/bin/python -m pytest          # roda os testes do backend
cd frontend && npx tsc -b --noEmit          # checa erros de tipo do TypeScript
cd frontend && npm run lint                 # checa o ESLint
```

---

## As camadas e a ordem de implementação

O backend do GiroChoffer é organizado em camadas: **Rotas → DTOs → Repositórios → SQL → Banco**. O frontend espelha o contrato da API: **api.ts → types.ts → schemas.ts → página → router/menu**.

Vamos implementar **de baixo para cima**. Essa ordem evita "ficar travado": cada camada que você cria já tem a camada de baixo pronta para usar.

Ordem completa:

1. **SQL** das tabelas novas (`favorito_motorista_sql.py`, `avaliacao_sql.py`).
2. **Model** de domínio da avaliação (`avaliacao_model.py`).
3. **Repositórios** (`favorito_motorista_repo.py`, `avaliacao_repo.py`).
4. **DTO de entrada** da avaliação (`avaliacao_dto.py`).
5. **Response (DTO de saída)** da avaliação (`avaliacao_response.py`).
6. **Rotas** (editar `empresa_routes.py` e `motorista_routes.py`).
7. **Registrar a tabela nova no startup** (editar `main.py`). ⚠️ Passo que mais se erra.
8. **Frontend: tipos** (`types.ts`).
9. **Frontend: schema Zod** (`schemas.ts`).
10. **Frontend: card e página** (`MotoristaInteressadoCard.tsx`, nova `EmpresaFavoritosPage.tsx`).
11. **Frontend: registrar rota e menu** (`router.tsx`, `Header.tsx`). ⚠️ Outro passo que se erra.

Por que de baixo para cima? Porque a rota chama o repositório, o repositório chama o SQL, e o frontend chama a rota. Se você começar pela tela, ainda não há o que chamar. Construindo a fundação primeiro, cada teste funciona assim que você termina a camada.

---

# PARTE 1 — BACKEND

## Passo 1.1 — SQL da tabela `favorito_motorista`

**Arquivo:** `backend/sql/favorito_motorista_sql.py` — **ARQUIVO NOVO**

Este arquivo contém apenas as constantes de SQL (texto puro), seguindo exatamente o padrão de `backend/sql/interesse_carga_sql.py`. Veja: usamos `UNIQUE (empresa_id, motorista_id)` para garantir idempotência (não dá para favoritar duas vezes), e `FOREIGN KEY ... ON DELETE CASCADE` para que, ao apagar a empresa ou o motorista, o favorito suma junto.

```python
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
```

Pontos importantes:

- **Nomes das constantes em MAIÚSCULAS** (`CRIAR_TABELA`, `INSERIR`, etc.): é a convenção do projeto.
- **Todos os valores entram por `?`** (prepared statements). Nunca monte SQL com f-string e o valor dentro — isso abre brecha de SQL injection e o projeto proíbe.
- O `SELECT` é praticamente igual ao de `interesse_carga`, só trocando `interesse_carga`→`favorito_motorista` e `carga_id`→`empresa_id`. Reaproveitar o formato faz o card do frontend funcionar sem mudanças.

## Passo 1.2 — SQL da tabela `avaliacao`

**Arquivo:** `backend/sql/avaliacao_sql.py` — **ARQUIVO NOVO**

Aqui `carga_id` é **UNIQUE**: uma carga só pode ser avaliada uma vez. Note também o `CHECK (nota >= 1 AND nota <= 5)` no banco, que reforça no nível mais baixo a regra de "nota de 1 a 5".

```python
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
```

Pontos importantes:

- `carga_id INTEGER NOT NULL UNIQUE`: trava no banco a regra "uma avaliação por carga".
- `MEDIA_POR_MOTORISTA` usa `AVG(nota)`; se não houver avaliações, o `AVG` retorna `NULL` (vamos tratar isso no repositório).
- Na hora de inserir, passamos a data com `agora()` (você verá no repo). O default `CURRENT_TIMESTAMP` existe como rede de segurança, mas o projeto exige `agora()` ao salvar.

## Passo 1.3 — Model de domínio da avaliação

**Arquivo:** `backend/model/avaliacao_model.py` — **ARQUIVO NOVO**

O model é um `@dataclass` puro (nunca dict). Espelha as colunas da tabela e inclui campos "derivados" (vindos de JOIN) só para exibição, exatamente como o `Carga` faz com `empresa_nome`.

```python
"""
Modelo de domínio de avaliação (GiroChoffer).

Uma avaliação registra a nota (1..5) e um comentário que a empresa dá ao
motorista após a conclusão de uma carga. Os campos empresa_nome e carga_titulo
são derivados de JOIN, apenas para exibição (não são colunas próprias).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Avaliacao:
    """Avaliação de um motorista por uma empresa, referente a uma carga."""

    id: int
    carga_id: int
    empresa_id: int
    motorista_id: int
    nota: int
    comentario: Optional[str] = None
    data: Optional[datetime] = None
    # Campos derivados (JOIN) — só para exibição
    empresa_nome: Optional[str] = None
    carga_titulo: Optional[str] = None
```

> Não criamos um model para `favorito_motorista`. Igual a `interesse_carga`, o favorito é só um vínculo; suas leituras devolvem "resumo de motorista" como **dict** (para não acoplar este módulo ao módulo de motorista). É exatamente o que o `interesse_carga_repo` faz.

## Passo 1.4 — Repositório `favorito_motorista_repo`

**Arquivo:** `backend/repo/favorito_motorista_repo.py` — **ARQUIVO NOVO**

Este repo é quase um clone de `interesse_carga_repo.py`. Funções de módulo (não classe). A conexão vem sempre de `obter_conexao()` (que já faz commit no sucesso e rollback no erro). A idempotência usa o mesmo truque: `existe()` para a rota responder 409, e o `inserir()` engole `IntegrityError` retornando `None`.

```python
"""
Repositório de Favoritos de Motorista (N:N empresa <-> motorista).

Espelha o padrão de interesse_carga_repo:
- existe(): permite à rota responder 409 sem depender da exceção de integridade.
- inserir(): idempotente; se já existir (viola UNIQUE), retorna None.
- remover(): apaga o vínculo (idempotente; True se removeu alguma linha).
- obter_motoristas_da_empresa(): retorna dicts no formato "resumo de motorista".
"""

import sqlite3
from typing import Optional

from sql.favorito_motorista_sql import (
    CRIAR_TABELA,
    INSERIR,
    EXISTE,
    REMOVER,
    OBTER_MOTORISTAS_POR_EMPRESA,
)
from util.db_util import obter_conexao
from util.logger_config import logger


def _row_to_motorista_resumo(row: sqlite3.Row) -> dict:
    """Converte row em dict no formato MotoristaResumo (campos de exibição)."""
    return {
        "id": row["motorista_id"],
        "nome": row["nome"],
        "cidade": row["cidade"],
        "nota": row["nota"],
        "total_viagens": row["total_viagens"],
        "foto_url": row["foto_url"],
        "veiculo_principal": row["veiculo_principal"],
        "carroceria": row["carroceria"],
        "capacidade_kg": row["capacidade_kg"],
    }


def criar_tabela() -> bool:
    """Cria a tabela de favoritos se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def existe(empresa_id: int, motorista_id: int) -> bool:
    """Verifica se essa empresa já favoritou esse motorista."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE, (empresa_id, motorista_id))
        return cursor.fetchone() is not None


def inserir(empresa_id: int, motorista_id: int) -> Optional[int]:
    """
    Marca um motorista como favorito de uma empresa.

    Idempotente: se já existir (viola UNIQUE), retorna None em vez de propagar a
    exceção de integridade. A rota deve checar existe() antes para responder 409.
    """
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(INSERIR, (empresa_id, motorista_id))
            return cursor.lastrowid
    except sqlite3.IntegrityError:
        logger.info(
            f"Favorito já existente (empresa={empresa_id}, motorista={motorista_id})."
        )
        return None


def remover(empresa_id: int, motorista_id: int) -> bool:
    """Remove o favorito (True se alguma linha foi apagada)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(REMOVER, (empresa_id, motorista_id))
        return cursor.rowcount > 0


def obter_motoristas_da_empresa(empresa_id: int) -> list[dict]:
    """Lista os motoristas favoritados por uma empresa, como dicts de resumo."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_MOTORISTAS_POR_EMPRESA, (empresa_id,))
        return [_row_to_motorista_resumo(row) for row in cursor.fetchall()]
```

Pontos importantes:

- `criar_tabela()` é **obrigatória**: o `main.py` chama essa função no startup. Sem ela, a tabela nunca é criada.
- `obter_motoristas_da_empresa()` devolve **dicts** com exatamente as mesmas chaves de `MotoristaResumoResponse`. Por isso, na rota, conseguimos fazer `MotoristaResumoResponse(**d)` direto.

## Passo 1.5 — Repositório `avaliacao_repo`

**Arquivo:** `backend/repo/avaliacao_repo.py` — **ARQUIVO NOVO**

Aqui há uma novidade: além de inserir a avaliação, precisamos **recalcular** a média e gravar em `motorista.nota`. Para isso, fazemos um pequeno `UPDATE motorista SET nota = ?` dentro do repo de avaliação (o repo é o lugar certo para falar com o banco). Usamos `agora()` para a data, conforme a regra do projeto.

```python
"""
Repositório de Avaliações (GiroChoffer).

- inserir(): grava a avaliação (data via agora()). carga_id é UNIQUE: a rota deve
  checar existe_por_carga() antes para responder 409.
- media_por_motorista(): média das notas (0.0 se ainda não houver avaliações).
- recalcular_nota_motorista(): grava a média atual em motorista.nota.
- obter_por_motorista(): avaliações recebidas, com nome da empresa e título da
  carga (para exibição).
"""

import sqlite3
from typing import Optional

from model.avaliacao_model import Avaliacao
from sql.avaliacao_sql import (
    CRIAR_TABELA,
    INSERIR,
    EXISTE_POR_CARGA,
    MEDIA_POR_MOTORISTA,
    OBTER_POR_MOTORISTA,
)
from util.datetime_util import agora
from util.db_util import obter_conexao


def _row_to_avaliacao(row: sqlite3.Row) -> Avaliacao:
    """Converte sqlite3.Row em dataclass Avaliacao (com campos de JOIN)."""
    chaves = row.keys()
    return Avaliacao(
        id=row["id"],
        carga_id=row["carga_id"],
        empresa_id=row["empresa_id"],
        motorista_id=row["motorista_id"],
        nota=row["nota"],
        comentario=row["comentario"],
        data=row["data"],
        empresa_nome=row["empresa_nome"] if "empresa_nome" in chaves else None,
        carga_titulo=row["carga_titulo"] if "carga_titulo" in chaves else None,
    )


def criar_tabela() -> bool:
    """Cria a tabela de avaliações se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def existe_por_carga(carga_id: int) -> bool:
    """Verifica se a carga já foi avaliada (carga_id é UNIQUE)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXISTE_POR_CARGA, (carga_id,))
        return cursor.fetchone() is not None


def inserir(avaliacao: Avaliacao) -> Optional[int]:
    """
    Insere uma avaliação e retorna o id gerado.

    A data é definida via agora() (timezone da aplicação). carga_id é UNIQUE; a
    rota deve checar existe_por_carga() antes para responder 409 explicitamente.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            avaliacao.carga_id,
            avaliacao.empresa_id,
            avaliacao.motorista_id,
            avaliacao.nota,
            avaliacao.comentario,
            agora(),
        ))
        return cursor.lastrowid


def media_por_motorista(motorista_id: int) -> float:
    """Média das notas do motorista (0.0 se ele ainda não tem avaliações)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(MEDIA_POR_MOTORISTA, (motorista_id,))
        row = cursor.fetchone()
        media = row["media"] if row else None
        return round(float(media), 2) if media is not None else 0.0


def recalcular_nota_motorista(motorista_id: int) -> float:
    """
    Recalcula a média do motorista e grava em motorista.nota. Retorna a média.
    """
    media = media_por_motorista(motorista_id)
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE motorista SET nota = ? WHERE id = ?",
            (media, motorista_id),
        )
    return media


def obter_por_motorista(motorista_id: int) -> list[Avaliacao]:
    """Lista as avaliações recebidas por um motorista (mais recentes primeiro)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_MOTORISTA, (motorista_id,))
        return [_row_to_avaliacao(row) for row in cursor.fetchall()]
```

Pontos importantes:

- `media_por_motorista` trata o `NULL` do `AVG` retornando `0.0`. Sem esse cuidado, um `float(None)` quebraria.
- `recalcular_nota_motorista` faz o `UPDATE` direto. É um SQL inline curto e específico — aceitável aqui. Ele será chamado pela rota **logo após** inserir a avaliação.
- `agora()` vem de `util/datetime_util.py`. **Nunca** use `datetime.now()`.

## Passo 1.6 — DTO de entrada da avaliação

**Arquivo:** `backend/dtos/avaliacao_dto.py` — **ARQUIVO NOVO**

O DTO valida o corpo do `POST .../avaliar`. Usamos `validar_inteiro_range` (já existe em `dtos/validators.py`) para garantir a nota entre 1 e 5, e `validar_comprimento` para o comentário opcional. Se a validação falhar, o Pydantic levanta `ValueError`, que o FastAPI converte em **422**.

```python
"""
DTO de entrada da avaliação de um motorista (POST /empresa/cargas/{id}/avaliar).

Reaproveita os validators de dtos/validators.py: a nota é um inteiro de 1 a 5
e o comentário é opcional (até 500 caracteres).
"""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_inteiro_range, validar_comprimento


class AvaliarMotoristaDTO(BaseModel):
    """Corpo do POST /empresa/cargas/{id}/avaliar."""

    nota: int = Field(..., description="Nota de 1 a 5")
    comentario: Optional[str] = Field(default=None, description="Comentário (opcional)")

    _validar_nota = field_validator("nota")(
        validar_inteiro_range(min_valor=1, max_valor=5, nome_campo="Nota")
    )

    _validar_comentario = field_validator("comentario")(
        validar_comprimento(tamanho_maximo=500)
    )
```

Pontos importantes:

- A nota chega no JSON como número; o `int` do Pydantic e o `validar_inteiro_range(1, 5)` cuidam do resto.
- `validar_comprimento` permite vazio/None (não é obrigatório) e limita o tamanho.

## Passo 1.7 — Response (DTO de saída) da avaliação

**Arquivo:** `backend/dtos/responses/avaliacao_response.py` — **ARQUIVO NOVO**

O Response é o que a API devolve em JSON. Segue o padrão: uma `BaseModel` com factory `classmethod de_avaliacao(...)`. Datas viram string ISO (o Pydantic serializa `datetime` automaticamente, mas convertemos para `str` por consistência).

```python
"""
Schema de resposta de avaliação (GiroChoffer).

Factory de_avaliacao() monta o response a partir da entidade Avaliacao, incluindo
os campos derivados (empresa_nome, carga_titulo) usados na lista do motorista.
"""

from typing import Optional

from pydantic import BaseModel

from model.avaliacao_model import Avaliacao


class AvaliacaoResponse(BaseModel):
    """Avaliação na visão de quem a recebeu (motorista) ou de quem a criou."""

    id: int
    carga_id: int
    empresa_id: int
    motorista_id: int
    nota: int
    comentario: Optional[str] = None
    data: Optional[str] = None
    empresa_nome: Optional[str] = None
    carga_titulo: Optional[str] = None

    @classmethod
    def de_avaliacao(cls, avaliacao: Avaliacao) -> "AvaliacaoResponse":
        """Constrói o response a partir da entidade Avaliacao."""
        return cls(
            id=avaliacao.id,
            carga_id=avaliacao.carga_id,
            empresa_id=avaliacao.empresa_id,
            motorista_id=avaliacao.motorista_id,
            nota=avaliacao.nota,
            comentario=avaliacao.comentario,
            data=str(avaliacao.data) if avaliacao.data else None,
            empresa_nome=avaliacao.empresa_nome,
            carga_titulo=avaliacao.carga_titulo,
        )
```

## Passo 1.8 — Rotas da Empresa: favoritar e avaliar

**Arquivo:** `backend/routes/empresa_routes.py` — **EDIÇÃO**

Vamos adicionar **quatro** endpoints à empresa: favoritar, desfavoritar, listar favoritos, e avaliar. Faça três pequenas alterações neste arquivo.

### 1.8.a — Novos imports

Encontre o bloco de imports no topo. Logo abaixo da linha que importa os DTOs de carga:

```python
# DTOs (entrada)
from dtos.carga_dto import NovaCargaDTO, EscolherMotoristaDTO
from dtos.empresa_dto import AtualizarEmpresaDTO
```

acrescente o import do DTO de avaliação:

```python
from dtos.avaliacao_dto import AvaliarMotoristaDTO
```

Na seção de responses, abaixo de:

```python
from dtos.responses.motorista_response import MotoristaResumoResponse
```

acrescente:

```python
from dtos.responses.avaliacao_response import AvaliacaoResponse
from dtos.responses.comum import MensagemResponse
```

> `PaginaResponse` já estava importado de `comum`; agora importamos também `MensagemResponse` (usado nas respostas de favoritar/desfavoritar).

Na seção de repositórios, troque a linha:

```python
from repo import carga_repo, empresa_repo, interesse_carga_repo
```

por:

```python
from repo import (
    carga_repo,
    empresa_repo,
    interesse_carga_repo,
    favorito_motorista_repo,
    avaliacao_repo,
)
```

### 1.8.b — Novos rate limiters

Logo após o `empresa_perfil_limiter` (no bloco "Rate Limiters"), adicione dois limitadores. Eles seguem o mesmo molde dos existentes:

```python
empresa_favorito_limiter = DynamicRateLimiter(
    chave_max="rate_limit_empresa_favorito_max",
    chave_minutos="rate_limit_empresa_favorito_minutos",
    padrao_max=60,
    padrao_minutos=10,
    nome="empresa_favorito",
)
empresa_avaliar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_empresa_avaliar_max",
    chave_minutos="rate_limit_empresa_avaliar_minutos",
    padrao_max=30,
    padrao_minutos=10,
    nome="empresa_avaliar",
)
```

### 1.8.c — Endpoints novos

Adicione os endpoints abaixo no fim do arquivo (depois das rotas de perfil). Repare em cada padrão obrigatório, que é idêntico ao das rotas que já existem:

- `@router.<metodo>(...)` em cima, `@requer_autenticacao([Perfil.EMPRESA.value])` logo abaixo.
- `request: Request` é o **primeiro** parâmetro; `usuario_logado: Optional[UsuarioLogado] = None` é o **último**; e no corpo, `assert usuario_logado is not None`.
- Erros sempre via `raise HTTPException(...)`.

```python
# =============================================================================
# Favoritar motorista (N:N empresa <-> motorista)
# =============================================================================

@router.post("/favoritos/{motorista_id}", response_model=MensagemResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def favoritar_motorista(
    request: Request,
    motorista_id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Marca um motorista como favorito da empresa logada (idempotente; 409 se já existe)."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_favorito_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    if favorito_motorista_repo.existe(empresa.id, motorista_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este motorista já está nos seus favoritos.",
        )

    favorito_id = favorito_motorista_repo.inserir(empresa.id, motorista_id)
    if not favorito_id:
        # Corrida: outro request inseriu entre o existe() e o inserir().
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este motorista já está nos seus favoritos.",
        )

    logger.info(f"Empresa {empresa.id} favoritou o motorista {motorista_id}")
    return MensagemResponse(message="Motorista adicionado aos favoritos.")


@router.delete("/favoritos/{motorista_id}", response_model=MensagemResponse)
@requer_autenticacao([Perfil.EMPRESA.value])
async def desfavoritar_motorista(
    request: Request,
    motorista_id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Remove um motorista dos favoritos da empresa logada (404 se não era favorito)."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_favorito_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)

    if not favorito_motorista_repo.remover(empresa.id, motorista_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este motorista não estava nos seus favoritos.",
        )

    logger.info(f"Empresa {empresa.id} removeu o motorista {motorista_id} dos favoritos")
    return MensagemResponse(message="Motorista removido dos favoritos.")


@router.get("/favoritos", response_model=list[MotoristaResumoResponse])
@requer_autenticacao([Perfil.EMPRESA.value])
async def listar_favoritos(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista os motoristas favoritados pela empresa logada."""
    assert usuario_logado is not None

    empresa = _obter_empresa_logada(usuario_logado)

    favoritos_dicts = favorito_motorista_repo.obter_motoristas_da_empresa(empresa.id)
    return [MotoristaResumoResponse(**d) for d in favoritos_dicts]


# =============================================================================
# Avaliar motorista (apenas carga Concluída)
# =============================================================================

@router.post("/cargas/{id}/avaliar", response_model=AvaliacaoResponse, status_code=status.HTTP_201_CREATED)
@requer_autenticacao([Perfil.EMPRESA.value])
async def avaliar_motorista(
    request: Request,
    id: int,
    dto: AvaliarMotoristaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Avalia o motorista que fez o frete. Só permitido se a carga estiver Concluída."""
    assert usuario_logado is not None
    checar_rate_limit(empresa_avaliar_limiter, request)

    empresa = _obter_empresa_logada(usuario_logado)
    carga = _obter_carga_da_empresa(id, empresa)

    if carga.status != StatusCarga.CONCLUIDA:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível avaliar uma carga já concluída.",
        )

    if carga.motorista_escolhido_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Esta carga não tem um motorista contratado para avaliar.",
        )

    if avaliacao_repo.existe_por_carga(id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta carga já foi avaliada.",
        )

    avaliacao = Avaliacao(
        id=0,
        carga_id=id,
        empresa_id=empresa.id,
        motorista_id=carga.motorista_escolhido_id,
        nota=dto.nota,
        comentario=dto.comentario,
    )
    avaliacao_id = avaliacao_repo.inserir(avaliacao)
    if not avaliacao_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar a avaliação. Tente novamente.",
        )

    # Recalcula e grava a média do motorista (motorista.nota).
    avaliacao_repo.recalcular_nota_motorista(carga.motorista_escolhido_id)

    logger.info(
        f"Empresa {empresa.id} avaliou a carga {id} "
        f"(motorista {carga.motorista_escolhido_id}, nota {dto.nota})"
    )

    criada = avaliacao_repo.obter_por_motorista(carga.motorista_escolhido_id)
    # A avaliação recém-criada é a mais recente (lista ordenada por data DESC).
    return AvaliacaoResponse.de_avaliacao(criada[0])
```

Você também precisa importar o model `Avaliacao` no topo deste arquivo (junto dos outros models). Abaixo de:

```python
from model.carga_model import Carga, StatusCarga
```

acrescente:

```python
from model.avaliacao_model import Avaliacao
```

Pontos importantes:

- O motorista avaliado **não** vem do corpo: ele é o `carga.motorista_escolhido_id`. Isso impede a empresa de avaliar um motorista que não fez o frete.
- A ordem das checagens importa: 404/403 (a carga é da empresa? — feito por `_obter_carga_da_empresa`), depois 409 (está Concluída?), depois 422 (tem motorista?), depois 409 (já avaliada?).
- Logo após inserir, chamamos `recalcular_nota_motorista`. É isso que faz a média aparecer atualizada no card.

## Passo 1.9 — Rota do Motorista: listar avaliações recebidas

**Arquivo:** `backend/routes/motorista_routes.py` — **EDIÇÃO**

Adicione o endpoint `GET /motorista/avaliacoes`. Faça três alterações.

### 1.9.a — Imports

Na seção de responses, abaixo de:

```python
from dtos.responses.motorista_response import MotoristaResponse
```

acrescente:

```python
from dtos.responses.avaliacao_response import AvaliacaoResponse
```

Na seção de repositórios, adicione `avaliacao_repo` à lista de imports:

```python
from repo import (
    carga_repo,
    interesse_carga_repo,
    motorista_repo,
    veiculo_repo,
    avaliacao_repo,
)
```

### 1.9.b — Rate limiter

Junto dos outros limitadores deste arquivo, adicione:

```python
motorista_avaliacoes_limiter = DynamicRateLimiter(
    chave_max="rate_limit_motorista_avaliacoes_max",
    chave_minutos="rate_limit_motorista_avaliacoes_minutos",
    padrao_max=60,
    padrao_minutos=1,
    nome="motorista_avaliacoes",
)
```

### 1.9.c — Endpoint

Adicione, por exemplo, logo antes da seção "Perfil do motorista":

```python
# =============================================================================
# Avaliações recebidas
# =============================================================================

@router.get("/avaliacoes", response_model=list[AvaliacaoResponse])
@requer_autenticacao([Perfil.MOTORISTA.value])
async def listar_avaliacoes(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista as avaliações recebidas pelo motorista logado (mais recentes primeiro)."""
    assert usuario_logado is not None
    checar_rate_limit(motorista_avaliacoes_limiter, request)
    motorista = _obter_motorista_logado(usuario_logado)

    avaliacoes = avaliacao_repo.obter_por_motorista(motorista.id)
    return [AvaliacaoResponse.de_avaliacao(a) for a in avaliacoes]
```

## Passo 1.10 — Registrar as tabelas novas no startup ⚠️

**Arquivo:** `backend/main.py` — **EDIÇÃO**

Este é o passo que mais se erra. Se você não registrar a tabela aqui, ela **nunca é criada** no banco, e toda chamada que mexe nela vai falhar com erro de "no such table". Faça duas alterações.

### 1.10.a — Importar os repositórios novos

Encontre o segundo bloco de import de repositórios (o do GiroChoffer):

```python
from repo import (
    catalogo_repo,
    empresa_repo,
    motorista_repo,
    veiculo_repo,
    carga_repo,
    interesse_carga_repo,
)
```

Acrescente os dois repos novos:

```python
from repo import (
    catalogo_repo,
    empresa_repo,
    motorista_repo,
    veiculo_repo,
    carga_repo,
    interesse_carga_repo,
    favorito_motorista_repo,
    avaliacao_repo,
)
```

### 1.10.b — Registrar na lista `TABELAS`

Encontre a lista `TABELAS`. Adicione as duas tabelas novas **depois** de `motorista` e `carga` (porque elas têm FK para essas tabelas; a ordem importa). Coloque-as logo após `interesse_carga`:

```python
TABELAS = [
    (usuario_repo, "usuario"),
    # GiroChoffer (ordem de FK; catalogo_repo cria tipo_veiculo + tipo_carroceria)
    (catalogo_repo, "tipo_veiculo + tipo_carroceria"),
    (empresa_repo, "empresa"),
    (motorista_repo, "motorista"),
    (veiculo_repo, "veiculo"),
    (carga_repo, "carga"),
    (interesse_carga_repo, "interesse_carga"),
    (favorito_motorista_repo, "favorito_motorista"),   # <-- NOVO
    (avaliacao_repo, "avaliacao"),                      # <-- NOVO
    (configuracao_repo, "configuracao"),
]
```

> Por que a ordem importa? `favorito_motorista` referencia `empresa` e `motorista`; `avaliacao` referencia `carga`, `empresa` e `motorista`. Como o SQLite cria FKs na hora do `CREATE TABLE`, as tabelas referenciadas precisam já existir. Colocá-las depois de `carga` e `motorista` garante isso.

> **Não é preciso registrar router novo:** as rotas novas foram adicionadas a routers que **já existem** (`empresa_router` e `motorista_router`), que já estão na lista `ROUTERS`. Se algum dia você criar um router em um **arquivo novo**, aí sim teria que importá-lo e adicioná-lo em `ROUTERS` no `main.py` — é assim que `empresa_router` e `motorista_router` já estão lá.

### 1.10.c — Reinicie o backend

Pare o backend (Ctrl+C no Terminal 1) e suba de novo:

```bash
backend/.venv/bin/python backend/main.py
```

Procure no log as linhas `Tabela 'favorito_motorista' criada/verificada` e `Tabela 'avaliacao' criada/verificada`. Se elas aparecerem, as tabelas foram criadas. Abra `http://127.0.0.1:8412/docs` e confirme que os endpoints novos aparecem.

---

# PARTE 2 — FRONTEND

## Passo 2.1 — Tipos espelhados

**Arquivo:** `frontend/src/lib/types.ts` — **EDIÇÃO**

Os tipos do frontend têm que bater **exatos** com os Response DTOs do backend. Adicione a interface de avaliação. Coloque, por exemplo, logo após o bloco `// ===== Motorista =====`:

```ts
// ===== Avaliação =====
export interface Avaliacao {
  id: number
  carga_id: number
  empresa_id: number
  motorista_id: number
  nota: number
  comentario?: string | null
  data?: string | null
  empresa_nome?: string | null
  carga_titulo?: string | null
}
```

> Repare: nomes em **snake_case**, iguais ao JSON do backend (`carga_id`, `empresa_nome`). O tipo `MotoristaResumo` já existe e é o que `GET /empresa/favoritos` retorna (lista de `MotoristaResumo`), então não precisamos criar nada novo para a lista de favoritos.

## Passo 2.2 — Schema Zod da avaliação

**Arquivo:** `frontend/src/lib/schemas.ts` — **EDIÇÃO**

O schema valida o formulário de avaliação no navegador, espelhando o `AvaliarMotoristaDTO` do backend. Adicione ao fim do arquivo:

```ts
// ===== Avaliação (empresa avalia motorista) =====

export const avaliarMotoristaSchema = z.object({
  nota: z.coerce
    .number({ message: 'Informe a nota' })
    .int('A nota deve ser um número inteiro')
    .min(1, 'A nota mínima é 1')
    .max(5, 'A nota máxima é 5'),
  comentario: z
    .string()
    .trim()
    .max(500, 'O comentário deve ter no máximo 500 caracteres')
    .optional(),
})
export type AvaliarMotoristaForm = z.infer<typeof avaliarMotoristaSchema>
```

Pontos importantes:

- `z.coerce.number()` converte o valor do `<select>`/`<input>` (que chega como string) para número.
- Os limites `1..5` e `max(500)` espelham exatamente as regras do backend. Se um lado mudar, mude o outro também.

## Passo 2.3 — Botão "Favoritar" no card do motorista

**Arquivo:** `frontend/src/components/giro/MotoristaInteressadoCard.tsx` — **EDIÇÃO**

Vamos adicionar duas coisas ao card: (1) um botão de favoritar/desfavoritar (coração), e (2) já que a média de avaliação (`nota`) vem no `MotoristaResumo`, ela continua aparecendo no card como `⭐ {m.nota}` — não precisa mudar isso, só confirmar que está lá.

Primeiro, amplie as **props** do componente para receber o estado de favorito e o callback. Troque a assinatura:

```tsx
export default function MotoristaInteressadoCard({
  motorista,
  escolhido = false,
  podeEscolher = false,
  onEscolher,
}: {
  motorista: MotoristaResumo
  escolhido?: boolean
  podeEscolher?: boolean
  onEscolher?: () => void
}) {
```

por esta (note os campos novos `favorito` e `onToggleFavorito`):

```tsx
export default function MotoristaInteressadoCard({
  motorista,
  escolhido = false,
  podeEscolher = false,
  onEscolher,
  favorito = false,
  onToggleFavorito,
}: {
  motorista: MotoristaResumo
  escolhido?: boolean
  podeEscolher?: boolean
  onEscolher?: () => void
  favorito?: boolean
  onToggleFavorito?: () => void
}) {
```

Agora, dentro do `return`, logo **antes** do bloco `{podeEscolher && (...)}`, adicione o botão de favoritar. Ele só aparece se o componente receber `onToggleFavorito`:

```tsx
      {onToggleFavorito && (
        <button
          onClick={onToggleFavorito}
          title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '22px',
            lineHeight: 1,
            color: favorito ? '#E53E3E' : colors.muted,
            flex: 'none',
          }}
        >
          {favorito ? '♥' : '♡'}
        </button>
      )}
```

Pontos importantes:

- Os novos parâmetros têm **valor padrão** (`favorito = false`) e o callback é **opcional**. Por isso, as telas que já usam este card (como `EmpresaDetalhesPage`) continuam funcionando sem alteração.
- O coração preenchido (`♥`) indica favoritado; o vazado (`♡`), não.

## Passo 2.4 — Nova página de favoritos

**Arquivo:** `frontend/src/pages/giro/EmpresaFavoritosPage.tsx` — **ARQUIVO NOVO**

Esta página lista os motoristas favoritos e permite desfavoritar (com confirmação via `pedirConfirmacao`, **nunca** `confirm()` nativo). Ela usa o hook `useFetch` para carregar os dados, e o `api` central para chamar a rota. Feedback sempre via `toast`.

```tsx
import { useCallback, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { MotoristaResumo } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { useFetch } from '@/hooks/useFetch'
import { toast, useUIStore } from '@/store/uiStore'
import MotoristaInteressadoCard from '@/components/giro/MotoristaInteressadoCard'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'

/* Página de motoristas favoritos da EMPRESA (rota /empresa/favoritos).
   Lista os favoritos e permite desfavoritar. */

export default function EmpresaFavoritosPage() {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [agindo, setAgindo] = useState(false)

  const carregar = useCallback(
    (signal: AbortSignal) => api.get<MotoristaResumo[]>('/empresa/favoritos', { signal }),
    [],
  )
  const { data: favoritos, carregando, erro, recarregar } = useFetch<MotoristaResumo[]>(carregar, [])

  function desfavoritar(motoristaId: number, nome: string) {
    pedirConfirmacao({
      titulo: 'Remover favorito',
      mensagem: `Remover ${nome} dos seus favoritos?`,
      textoConfirmar: 'Remover',
      tipo: 'danger',
      onConfirmar: async () => {
        setAgindo(true)
        try {
          await api.delete(`/empresa/favoritos/${motoristaId}`)
          toast.sucesso('Motorista removido dos favoritos.')
          recarregar()
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Não foi possível remover o favorito.')
        } finally {
          setAgindo(false)
        }
      },
    })
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '30px',
          color: colors.inkStrong,
          margin: '0 0 4px',
        }}
      >
        Motoristas favoritos
      </h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Os motoristas que você marcou como favoritos.
      </p>

      {carregando ? (
        <Spinner texto="Carregando favoritos..." />
      ) : erro ? (
        <EmptyState>Não foi possível carregar seus favoritos. Tente novamente.</EmptyState>
      ) : !favoritos || favoritos.length === 0 ? (
        <EmptyState padding="48px">Você ainda não favoritou nenhum motorista.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favoritos.map((m) => (
            <MotoristaInteressadoCard
              key={m.id}
              motorista={m}
              favorito
              onToggleFavorito={agindo ? undefined : () => desfavoritar(m.id, m.nome)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

Pontos importantes:

- `api.get<MotoristaResumo[]>('/empresa/favoritos', ...)`: o caminho é **relativo a `/api`** (não escreva `/api/empresa/favoritos`).
- Passamos `favorito` (sempre verdadeiro nesta tela, já que todos são favoritos) e `onToggleFavorito` (que aqui significa "remover").
- O CSRF é tratado automaticamente pelo `api.delete` — você não precisa fazer nada manualmente.

### Bônus: favoritar a partir do detalhe da carga

Para favoritar a partir da tela de detalhe (`EmpresaDetalhesPage.tsx`), o caminho é chamar `api.post(\`/empresa/favoritos/${motoristaId}\`)` no `onToggleFavorito` do card, mostrar `toast.sucesso(...)` e recarregar. Você precisaria saber quais já são favoritos (carregando `GET /empresa/favoritos` e montando um `Set` de ids). Isso é opcional para a entrega mínima; a página dedicada do Passo 2.4 já cobre o requisito.

## Passo 2.5 — Registrar a rota e o item de menu ⚠️

### 2.5.a — Rota no router

**Arquivo:** `frontend/src/router.tsx` — **EDIÇÃO**

Importe a página nova. Junto dos outros imports de páginas da empresa:

```tsx
// Empresa
import EmpresaPainelPage from './pages/giro/EmpresaPainelPage'
import EmpresaNovaCargaPage from './pages/giro/EmpresaNovaCargaPage'
import EmpresaDetalhesPage from './pages/giro/EmpresaDetalhesPage'
import EmpresaFavoritosPage from './pages/giro/EmpresaFavoritosPage'   // <-- NOVO
```

Depois, dentro do grupo `<EmpresaRoute>` → `<AppLayout>` (a lista de `children` com os paths `/empresa`, `/empresa/nova`, `/empresa/carga/:id`), adicione a rota nova:

```tsx
            children: [
              { path: '/empresa', element: <EmpresaPainelPage /> },
              { path: '/empresa/nova', element: <EmpresaNovaCargaPage /> },
              { path: '/empresa/favoritos', element: <EmpresaFavoritosPage /> },   // <-- NOVO
              { path: '/empresa/carga/:id', element: <EmpresaDetalhesPage /> },
            ],
```

> Importante: a rota precisa ficar **dentro** do grupo `<EmpresaRoute>` (guard de perfil) e do `<AppLayout>` (layout com o header). Se você colocar fora, a página abre sem cabeçalho ou sem a proteção de perfil.

### 2.5.b — Item de menu

**Arquivo:** `frontend/src/components/giro/Header.tsx` — **EDIÇÃO**

A navegação depende do perfil, e está no array `navDefs`. Adicione o par `['Favoritos', '/empresa/favoritos']` no ramo da **empresa** (`isEmpresa`):

```tsx
  const navDefs: [string, string][] = isEmpresa
    ? [
        ['Painel', '/empresa'],
        ['Nova carga', '/empresa/nova'],
        ['Favoritos', '/empresa/favoritos'],   // <-- NOVO
        ['Meu perfil', '/perfil'],
      ]
    : [
        ['Cargas disponíveis', '/motorista'],
        ['Minhas cargas', '/motorista/minhas'],
        ['Meu perfil', '/perfil'],
      ]
```

Pronto. Agora a empresa vê o link "Favoritos" no topo e consegue navegar até a página.

---

## Como testar

### Teste manual (fluxo completo na tela)

1. **Suba o backend** (Terminal 1) e confirme no log: `Tabela 'favorito_motorista' criada/verificada` e `Tabela 'avaliacao' criada/verificada`.

   ```bash
   backend/.venv/bin/python backend/main.py
   ```

2. **Suba o frontend** (Terminal 2):

   ```bash
   cd frontend && npm run dev
   ```

3. **Favoritar (A):**
   - Logue como **empresa** (senha do seed `1234aA@#`).
   - Abra uma carga com motoristas interessados (`/empresa/carga/:id`).
   - (Se você fez o bônus 2.4) clique no coração para favoritar; senão, favorite via API e veja.
   - Vá no menu **Favoritos**: o motorista deve aparecer na lista.
   - Clique no coração para remover; confirme no modal; a lista atualiza.

4. **Avaliar (B):**
   - Pegue uma carga sua que esteja **Contratada**, marque como **Concluída** (botão na tela de detalhe).
   - Chame `POST /api/empresa/cargas/{id}/avaliar` com corpo `{"nota": 5, "comentario": "Ótimo motorista"}` (pode usar o `/docs`).
   - Logue como o **motorista** avaliado e chame `GET /api/motorista/avaliacoes`: a avaliação deve aparecer.
   - Volte como empresa e abra a carga: a média (`⭐`) do motorista no card deve refletir a nota.

### Teste pelo Swagger (`/docs`)

Abra `http://127.0.0.1:8412/docs`. Você verá os endpoints novos:
`POST/DELETE /empresa/favoritos/{motorista_id}`, `GET /empresa/favoritos`, `POST /empresa/cargas/{id}/avaliar`, `GET /motorista/avaliacoes`. Faça login primeiro (a sessão é por cookie), depois experimente cada um.

### Checagens automáticas

```bash
backend/.venv/bin/python -m pytest          # testes do backend não podem quebrar
cd frontend && npx tsc -b --noEmit          # zero erros de tipo
cd frontend && npm run lint                 # zero erros de lint
```

### Exemplo de teste de avaliação (opcional)

O projeto usa `pytest`. Um teste de unidade simples para o repositório (a ideia é validar o recálculo de média):

```python
# backend/tests/unit/test_avaliacao_repo.py
from model.avaliacao_model import Avaliacao
from repo import avaliacao_repo


def test_media_sem_avaliacoes_eh_zero():
    # Um motorista sem avaliações deve ter média 0.0.
    assert avaliacao_repo.media_por_motorista(999999) == 0.0
```

> Rode com `backend/.venv/bin/python -m pytest backend/tests/unit/test_avaliacao_repo.py`. Adapte o id do motorista conforme o seu banco de testes.

---

## Erros comuns e como resolver

1. **"no such table: favorito_motorista" (ou avaliacao).**
   Você esqueceu de registrar a tabela no `main.py` (Passo 1.10) **ou** não reiniciou o backend. Confirme que o repo está importado e que a tupla `(favorito_motorista_repo, "favorito_motorista")` está na lista `TABELAS`. Pare e suba o backend de novo.

2. **404/405 ao chamar a rota nova.**
   Confira o caminho. O front usa caminho **relativo a `/api`** (`/empresa/favoritos`), e o backend monta tudo sob `/api` + `prefix="/empresa"`. Não escreva `/api/...` no front. Também verifique se você não trocou o método (POST x DELETE x GET).

3. **403 nas chamadas de mutação (favoritar/desfavoritar/avaliar) — CSRF.**
   Mutações exigem o header `X-CSRF-Token`. O `api` central (`@/lib/api`) faz isso automaticamente — desde que você use `api.post/delete`, e **não** `fetch` cru. Se você ver 403 com `type` de CSRF, está chamando `fetch` direto em algum lugar. Use sempre o `api`.

4. **422 ao avaliar.**
   O contrato não bateu. A nota tem que ser inteiro de 1 a 5 e o comentário até 500 caracteres, **nos dois lados** (`AvaliarMotoristaDTO` no backend e `avaliarMotoristaSchema` no front). Se mudar de um lado, espelhe no outro. O `ApiError.errors` traz o mapa campo→mensagem (em snake_case) para você exibir.

5. **A média do motorista não atualiza.**
   Você inseriu a avaliação mas não chamou `avaliacao_repo.recalcular_nota_motorista(...)` logo depois (Passo 1.8.c). Sem ele, `motorista.nota` não muda. Confirme também que está avaliando `carga.motorista_escolhido_id` (e não outro id).

6. **A página abre sem cabeçalho ou redireciona para o login.**
   A rota nova ficou fora do grupo `<EmpresaRoute>` / `<AppLayout>` no `router.tsx` (Passo 2.5.a). Ela tem que estar **dentro** desses dois grupos.

7. **TypeScript reclama de tipo em `MotoristaInteressadoCard`.**
   Você usou `onToggleFavorito`/`favorito` mas não declarou nas props (Passo 2.3). Confirme que ampliou a assinatura do componente. Rode `npx tsc -b --noEmit` para ver o erro exato.

---

## Checklist final

Marque cada item conforme concluir:

- [ ] `backend/sql/favorito_motorista_sql.py` criado (com `UNIQUE` e FKs `ON DELETE CASCADE`).
- [ ] `backend/sql/avaliacao_sql.py` criado (com `carga_id UNIQUE` e `CHECK (nota 1..5)`).
- [ ] `backend/model/avaliacao_model.py` criado (`@dataclass Avaliacao`).
- [ ] `backend/repo/favorito_motorista_repo.py` criado (`criar_tabela`, `existe`, `inserir`, `remover`, `obter_motoristas_da_empresa`).
- [ ] `backend/repo/avaliacao_repo.py` criado (`criar_tabela`, `existe_por_carga`, `inserir`, `media_por_motorista`, `recalcular_nota_motorista`, `obter_por_motorista`).
- [ ] `backend/dtos/avaliacao_dto.py` criado (`AvaliarMotoristaDTO`, nota 1..5).
- [ ] `backend/dtos/responses/avaliacao_response.py` criado (`AvaliacaoResponse.de_avaliacao`).
- [ ] `backend/routes/empresa_routes.py` editado: imports, rate limiters, 4 endpoints (favoritar, desfavoritar, listar favoritos, avaliar).
- [ ] `backend/routes/motorista_routes.py` editado: import, rate limiter, endpoint `GET /avaliacoes`.
- [ ] `backend/main.py` editado: repos importados **e** tabelas registradas em `TABELAS` (na ordem correta).
- [ ] Backend reiniciado; log mostra as duas tabelas criadas; `/docs` mostra os endpoints novos.
- [ ] `frontend/src/lib/types.ts` editado: interface `Avaliacao`.
- [ ] `frontend/src/lib/schemas.ts` editado: `avaliarMotoristaSchema`.
- [ ] `frontend/src/components/giro/MotoristaInteressadoCard.tsx` editado: props e botão de favorito.
- [ ] `frontend/src/pages/giro/EmpresaFavoritosPage.tsx` criado.
- [ ] `frontend/src/router.tsx` editado: import e rota `/empresa/favoritos` dentro de `<EmpresaRoute>`/`<AppLayout>`.
- [ ] `frontend/src/components/giro/Header.tsx` editado: item de menu "Favoritos".
- [ ] `npx tsc -b --noEmit`, `npm run lint` e `pytest` passando.
- [ ] Fluxo manual testado: favoritar/desfavoritar e avaliar (carga Concluída) com média atualizada.
```