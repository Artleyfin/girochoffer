# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

**GiroChoffer** — marketplace de fretes (projeto integrador). Empresas publicam cargas; motoristas demonstram interesse; a empresa escolhe o motorista. Construído sobre boilerplate educacional com **arquitetura SPLIT**: API REST JSON em FastAPI + SPA React, repos separados na mesma raiz.

- `backend/` — FastAPI (Python 3.11+, SQLite **sem ORM**, SQL puro com prepared statements). Serve **apenas JSON** sob `/api` + `static/`. Em produção também serve o `index.html` do SPA buildado.
- `frontend/` — SPA React 19 + React Router 7 + TypeScript + Zod + Zustand + Vite (gráficos do dashboard admin via `recharts`). UI 100% em **estilos inline** (sem Bootstrap nem framework CSS): tokens em `src/lib/theme.ts` + reset global mínimo em `src/styles/custom.css`; ícones via SVG inline. Páginas em `src/pages/giro/**`.
- Deploy: **girochoffer.ifes.site** (VPS Cachoeiro, container `girochoffer.ifes.site`, via Jenkins). Em dev, Vite faz proxy de `/api`, `/static`, `/health` → backend (same-origin, sem CORS).
- `projects/` e `.lesson-bridge/` são **workspace externo** (specs de outros projetos, plugins) — não fazem parte deste app; **ignore-os** ao analisar/editar o código.

> **Esquema de portas**: a porta interna do Uvicorn e a publicada batem em **8412** (Dockerfile `ENV PORT=8412`/`EXPOSE 8412`; `deploy/docker-compose.yml` mapeia `8412:8412`; healthcheck em `localhost:8412/health`). Dev local: backend default `PORT=8412` (`util/config.py`), Vite dev server na **5182** com proxy para `http://127.0.0.1:8412` (override via `VITE_BACKEND_URL`). Cada fork publica em porta própria.

> **Isolamento de projeto Compose**: `deploy/docker-compose.yml` fixa `name: girochoffer` no topo e pina os nomes físicos dos volumes (`deploy_girochoffer_data`/`deploy_girochoffer_uploads`). Sem o `name:`, todos os forks (compose em `deploy/`) virariam o mesmo projeto `deploy` no host, e o `down --remove-orphans` de um deploy derrubaria os containers dos outros (502 em massa).

## Comandos

### Backend (rodar a partir de `backend/`)
O `.python-version` aponta para 3.14 (não instalado) — **sempre** usar o interpretador do venv:

```bash
backend/.venv/bin/python main.py                    # sobe API (porta via .env PORT; default 8412)
backend/.venv/bin/python -m pytest                  # todos os testes
backend/.venv/bin/python -m pytest tests/unit       # só unitários
backend/.venv/bin/python -m pytest tests/integration/test_x.py::TestClasse::test_metodo  # um teste
backend/.venv/bin/python -m pytest -m "not slow"    # markers: slow, integration, unit, auth, crud
```
Docs interativas em `/docs`. `pytest.ini` usa `asyncio_mode=auto`.

### Frontend (rodar a partir de `frontend/`)
```bash
npm run dev          # Vite dev server na porta 5182 (proxy /api -> VITE_BACKEND_URL, fallback 8412)
npm run build        # tsc -b && vite build  (saída em dist/, servida pelo backend em prod)
npm run test         # vitest run
npx tsc -b --noEmit  # typecheck isolado
npm run lint         # eslint
```

## Contrato de API — eixo central da conformidade backend↔frontend

Mudou algo de um lado, espelhe no outro. Os dois lados têm que bater **exato**.

- **Prefixo único `/api`**: backend monta todos os routers sob `API_PREFIX="/api"` (`backend/main.py`); frontend `src/lib/api.ts` usa `BASE='/api'`. Caminhos no front são **relativos a `/api`** (não incluir o prefixo).
- **Cliente HTTP central**: `frontend/src/lib/api.ts` — `credentials:'include'`, header `X-CSRF-Token` automático, classe `ApiError` (`.status`, `.type`, `.message`, `.errors`, `.retryAfter`). **Toda** chamada do SPA passa por aqui.
- **Contrato de erro**: `{detail, type, errors}` via handlers globais em `backend/util/exception_handlers.py`. Validação 422 → `util/validation_util.py:processar_erros_validacao_lista` chaveia erros por `loc[-1]` (último segmento; body aninhado vira chave simples). Traceback de dev fica fora do contrato.
- **Paginação**: envelope `PaginaResponse[T]` (`backend/dtos/responses/comum.py`: `items/pagina/por_pagina/total/total_paginas`) ↔ `PaginaResponse<T>` em `frontend/src/lib/types.ts`. Params `pagina`/`por_pagina`.
- **CSRF**: mutações enviam `X-CSRF-Token`; `GET /api/csrf-token` → `{token}`. Único caminho isento de CSRF é `/health` (`CSRF_EXEMPT_PATHS` em `util/csrf_protection.py`).
- **Tipos espelhados**: Response DTOs em `backend/dtos/responses/*.py` ↔ tipos em `frontend/src/lib/types.ts` ↔ validação Zod em `frontend/src/lib/schemas.ts`.
- **Enums batem exato dos dois lados**: `Perfil` (Administrador/Empresa/Motorista — `util/perfis.py` ↔ `types.ts`) e `StatusCarga` (Disponível/Contratada/Concluída/Cancelada — `model/carga_model.py` ↔ `types.ts`) são os únicos enums do produto. (O rótulo "Com interessados" NÃO é status armazenado; é derivado de `DISPONIVEL` + `total_interesses > 0`.)

## Arquitetura backend (`backend/`)

Camadas: **Routes → DTOs → Repos → SQL → DB**. `main.py` registra repos (criação de tabelas) e routers.

- **Auth**: decorator `@requer_autenticacao()` (`util/auth_decorator.py`) + dataclass `UsuarioLogado` (NUNCA dict). Sessão por cookie (`SessionMiddleware`, `SameSite=lax`).
- **Ordem dos middlewares importa** (último `add_middleware` é o mais externo): SegurançaHeaders (externo) → Session → CSRF. CSRF precisa de `request.session` já populado.
- **Perfis**: enum `Perfil` de `util/perfis.py` (fonte única; NUNCA strings literais). Enums de domínio herdam de `EnumEntidade` (`util/enum_base.py`).
- **DB datetime**: usar `agora()` de `util/datetime_util.py` ao salvar (NUNCA `.strftime()`).
- **Validação de form**: validators em `dtos/validators.py`; levantam `ValueError` → 422.
- **Rate limit**: `util/api_helpers.py:checar_rate_limit` (já emite header `Retry-After`), usado pelas rotas. `util/rate_limiter.py` define as classes `RateLimiter` (estático) e `DynamicRateLimiter` (lê limites do `config_cache`); os limitadores nomeados vivem em `util/api_helpers.py`.
- **Seed** (`util/seed_data.py`, chamado em `main.py` no startup; catálogo de tipos de veículo/carroceria é seedado sempre via `catalogo_repo.seed_inicial()`):
  - `carregar_usuarios_seed()` — **sempre** (dev e prod), de `data/admin_seed.json` (perfil Administrador; fallback: 1 usuário por perfil). Único modo de ter admin num banco novo.
  - `carregar_girochoffer_demo()` — dados de demonstração (5 empresas, 6 motoristas + veículos, 10 cargas, interesses, contratações), senha padrão `SENHA_PADRAO_SEED="1234aA@#"`, fotos resolvidas via `_foto_seed()` (robusto a foto ausente → `foto_url=None`). Idempotente (guarda por e-mail da empresa âncora). **Roda só `if IS_DEVELOPMENT`** (`RUNNING_MODE` ≠ "development" em prod → demo NÃO é seedado). Para popular prod, rodar a função manualmente no container; o DB persiste no volume.

## Arquitetura frontend (`frontend/src/`)

**Leia `frontend/CONVENTIONS.md` antes de editar páginas.** A infra (api, tipos, stores, componentes, layouts, router) já existe — em geral só se implementam páginas em `src/pages/**`; não recriar helpers.

- `lib/` — `api.ts` (cliente), `schemas.ts` (Zod), `types.ts` (tipos+enums const `Perfil`/`StatusCarga`), `format.ts` (`formatarData/DataHora/Hora/Moeda/Bytes`), `masks.ts` (máscaras de input: `mascararCpf/Telefone/Moeda`, `apenasDigitos`, `moedaParaNumero`).
- `store/` — Zustand: `authStore` (sessão/usuário, `isAdmin()`), `uiStore` (toast/confirmação/alerta). Feedback **sempre** via `toast.sucesso/erro/aviso/info` ou `pedirConfirmacao`/`mostrarAlerta` — **NUNCA** `alert()/confirm()/prompt()` nativos.
- `hooks/useFetch.ts` — fetch com `{data, carregando, erro, recarregar}`.
- `router.tsx` — casca raiz `RootGate` (carrega sessão via `/api/me`; 401 anônimo é esperado) com `RouteError` de errorElement; layouts `AppLayout`/`AdminLayout`; guards `ProtectedRoute`, `AdminRoute`, `EmpresaRoute`, `MotoristaRoute`.
- `components/` — giro (`AppLayout`/`AdminLayout`, `Header`, `Button`, `FormControls`: Field/TextInput/SelectInput/TextArea, `StatusBadge`, cards de carga `CargaCardEmpresa`/`CargaCardMercado`/`CargaDetalheCard`/`CargaResumoRow` + `cargaVm.ts`, `MotoristaInteressadoCard`, `EmptyState`), routing (`RootGate`/`RouteError`/`ProtectedRoute`/`AdminRoute`/`EmpresaRoute`/`MotoristaRoute`), ui (Pagination, EmptyState, Spinner, Toasts, ConfirmModal, AlertModal).
- Alias `@` → `src/`.
- **Textareas controladas** NÃO populam via MCP `fill`/`fill_form`; usar setter nativo + dispatch de evento `input`.

## Módulos de domínio (rota backend ↔ página frontend)

Routers montados sob `/api` (`main.py`). O router de **auth** não tem sub-prefixo → endpoints ficam em `/api/login`, `/api/logout`, `/api/me`, `/api/csrf-token` etc. (não `/api/auth/...`).

Produto GiroChoffer (núcleo):
- **auth** (sem prefixo): login/logout/cadastrar/esqueci-senha/redefinir-senha/me/csrf-token. ↔ `AuthPage`, `RecuperarSenhaPage`.
- **usuario** (`/usuario`): perfil (ver/editar/foto base64/senha). ↔ `PerfilPage`.
- **catalogo** (`/catalogos`): `GET ""` lista tipos de veículo e carrocerias ativos (`CatalogoResponse`); seedado fixo no startup. Resolve FKs de veículos/cargas por nome.
- **empresa** (`/empresa`): listar/publicar cargas (`GET`/`POST /cargas`), detalhe (`GET /cargas/{id}`), escolher motorista (`PATCH /cargas/{id}/escolher`), concluir/cancelar (`PATCH .../concluir|cancelar`), perfil (`GET`/`PUT /perfil`). ↔ `EmpresaPainelPage` (`/empresa`), `EmpresaNovaCargaPage` (`/empresa/nova`), `EmpresaDetalhesPage` (`/empresa/carga/:id`).
- **motorista** (`/motorista`): feed de cargas (`GET /cargas`, paginado), detalhe (`GET /cargas/{id}`), demonstrar interesse (`POST /cargas/{id}/interesse`), minhas cargas (`GET /minhas`), perfil (`GET`/`PUT /perfil`). ↔ `MotoristaPainelPage` (`/motorista`), `MotoristaDetalhesPage` (`/motorista/carga/:id`), `MotoristaMinhasPage` (`/motorista/minhas`). **Listagens de carga exigem login** (escopo por perfil). `LandingPage` é a vitrine pública.
- **admin core**: dashboard (`/admin/dashboard` → `AdminDashboardPage`, com gráficos via `recharts`) e usuários CRUD (`/admin/usuarios` → `AdminUsuariosPage`). Os routers `admin_configuracoes_routes` (prefixo `/admin`, configs por categoria) e `admin_backups_routes` (`/admin/backups`, criar/restaurar/download) existem **só no backend** — **não há página de configurações nem de backups no SPA atual**.

> **Legado do starter kit REMOVIDO**: este fork enxugou o boilerplate. Foram **deletados** (não há `.py`/rota/UI): **chamados**/tickets, **chat** (SSE), **pagamentos** (Mercado Pago/Stripe/PayPal e webhooks), **notificações**, **auditoria**. Não existem os enums `StatusChamado`, `PrioridadeChamado`, `StatusPagamento`, `TipoInteracao`, `TipoNotificacao` no código atual, nem componentes `ChatWidget`/`NotificationBell`. Sobreviveu a infra core: auth/sessão/CSRF, headers de segurança, rate limit, configurações por categoria + backups (backend), seed, paginação, upload/foto base64, e-mail de recuperação de senha.

## Convenções de commit (do usuário)

- `git add` **SELETIVO**: só os arquivos que esta sessão alterou. NUNCA `git add -A/./-u`, `git commit -a/-am`. Rodar `git status --short` e cruzar com a lista de arquivos editados antes de commitar (há múltiplos agentes paralelos no mesmo repo).
- Pedir confirmação antes de push. PR só com permissão explícita por PR. Não se identificar como Claude nos commits.
