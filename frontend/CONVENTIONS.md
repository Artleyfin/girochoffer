# Convenções do Frontend (LEIA ANTES DE EDITAR QUALQUER PÁGINA)

Stack: **React 19 + React Router 7 + Zod + Zustand + TypeScript + Vite**.
UI **100% em estilos inline** (sem Bootstrap nem framework CSS): tokens de cor/fonte
em `src/lib/theme.ts`, reset global mínimo em `src/styles/custom.css`, ícones via
**SVG inline** (não há fonte de ícones). Visual replica o protótipo em
`design/girochoffer-react/` (cada página tem comentário com o `.jsx` de origem).

A infraestrutura (api, tipos, stores, componentes, layouts, router) **já existe**.
Você só implementa páginas em `src/pages/giro/**`. **NÃO** edite o router, os layouts nem a
infra, salvo instrução explícita. Use SEMPRE o que já existe — não recrie helpers.

## Cliente HTTP — `src/lib/api.ts`

```ts
import { api, ApiError } from '@/lib/api' // (ou caminho relativo)
const perfil = await api.get<Usuario>('/usuario/perfil')
const carga = await api.post<Carga>('/empresa/cargas', { titulo, origem, destino, /* ... */ })
await api.put<Usuario>('/usuario/perfil', { nome, telefone })
await api.patch(`/empresa/cargas/${id}/concluir`)
await api.post(`/motorista/cargas/${id}/interesse`)
```

- Caminhos são **relativos a `/api`** (não inclua o prefixo `/api`).
- `credentials: include` e header **`X-CSRF-Token`** são automáticos. Não se preocupe com CSRF.
- Query string: `api.get('/motorista/cargas', { params: { pagina, origem } })`.
- Erros lançam `ApiError` com `.status`, `.type`, `.message` (detail), `.errors` (por campo),
  `.retryAfter`. Para erro de validação (422): `err.errors?.campo?.[0]` ou `err.campo('campo')`.

## Tipos — `src/lib/types.ts`

Shapes de resposta do produto já estão lá: `Usuario`, `Empresa`, `Motorista`,
`MotoristaResumo`, `Veiculo`, `Carga`, `CargaResumo`, `CargaDetalhe` (empresa, com
`interessados`), `CargaDetalheMotorista` (motorista, com flags de interesse/contato),
`MinhasCargas`, `Catalogo`, `AdminDashboard` (+ `ContagemItem`/`SerieMensalItem`), `PaginaResponse<T>`.
Os dois únicos enums (objetos const) são `Perfil` (Administrador/Empresa/Motorista) e
`StatusCarga` (Disponível/Contratada/Concluída/Cancelada). **Importe daqui**, não redefina.

## Estado global — `src/store/`

```ts
import { useAuthStore } from '@/store/authStore'
const usuario = useAuthStore((s) => s.usuario)        // Usuario | null
const isAdmin = useAuthStore((s) => s.isAdmin())
const setUsuario = useAuthStore((s) => s.setUsuario)  // após editar perfil/foto

import { toast, useUIStore } from '@/store/uiStore'
toast.sucesso('Salvo!'); toast.erro('Falhou'); toast.info('...'); toast.aviso('...')
const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
const mostrarAlerta = useUIStore((s) => s.mostrarAlerta)
```

## Feedback ao usuário (REGRAS)

- **NUNCA** use `alert()`, `confirm()`, `prompt()` nativos.
- Notificações rápidas → `toast.sucesso/erro/aviso/info(msg)`.
- Confirmação de ação destrutiva → `pedirConfirmacao({ mensagem, tipo:'danger', onConfirmar })`.
- Aviso modal → `mostrarAlerta({ mensagem, tipo })`.

## Componentes prontos — `src/components/`

- `giro/AppLayout.tsx` / `giro/AdminLayout.tsx`: cascas de página (header/sidebar). Já aplicados pelo router.
- `giro/StatusBadge.tsx`: badge de status de carga (cores via `theme.statusColors`).
- `giro/CargaCardEmpresa` / `giro/CargaCardMercado` / `giro/CargaDetalheCard` / `giro/CargaResumoRow`:
  cards e linhas de carga; `giro/cargaVm.ts` deriva os view-models.
- `giro/MotoristaInteressadoCard.tsx`: linha de motorista interessado (avatar + nota).
- `giro/FormControls.tsx`: `Field` (wrapper label), `TextInput`, `SelectInput`, `TextArea`
  (named exports, estilos inline). Ex.: `<Field label="Origem"><TextInput value={v} onChange={...} /></Field>`.
- `giro/Button.tsx`: botão padrão (variantes via props).
- `giro/EmptyState.tsx` (default): caixa tracejada — `<EmptyState padding radius>{children}</EmptyState>`.
- `ui/EmptyState.tsx` (default): variante com ícone SVG — `<EmptyState titulo mensagem>{children}</EmptyState>`.
- `ui/Pagination.tsx` (default): `<Pagination pagina totalPaginas onPagina={(p)=>...} />`.
- `ui/Spinner.tsx` (default): `<Spinner texto?/>`.
- `ui/Toasts` / `ui/ConfirmModal` / `ui/AlertModal`: já montados em `RootGate` (não reinstanciar).

## Leitura de dados — `src/hooks/useFetch.ts`

```ts
import { useFetch } from '@/hooks/useFetch'
const carregar = useCallback(
  (signal: AbortSignal) => api.get<MinhasCargas>('/motorista/minhas', { signal }),
  [],
)
const { data, carregando, erro, recarregar } = useFetch<MinhasCargas>(carregar, [])
```
Renderize `<Spinner/>` quando `carregando`, trate `erro` (ex.: `toast.erro(erro.message)`), depois use `data`.

## Formatação — `src/lib/format.ts`

`formatarData`, `formatarDataHora`, `formatarHora`, `formatarMoeda`, `formatarBytes`.

## Máscaras de input — `src/lib/masks.ts`

Para campos com máscara (cadastro, perfil, nova carga): `mascararCpf`, `mascararTelefone`,
`mascararMoeda`, `apenasDigitos`, `formatarNumeroComoMoedaInput`, `moedaParaNumero`. Reutilize-os
em vez de reimplementar formatação de CPF/CNPJ/telefone/moeda no componente.

## Validação de formulários — Zod

`src/lib/schemas.ts` **já existe** com primitivos reutilizáveis (`senhaSchema`, `emailSchema`,
e refinements de CPF/CNPJ/telefone que espelham `backend/dtos/validators.py`). Reutilize-os.

```ts
import { z } from 'zod'
import { emailSchema, senhaSchema } from '@/lib/schemas'
const schema = z.object({ email: emailSchema, senha: senhaSchema })
type Form = z.infer<typeof schema>
// no submit:
const parsed = schema.safeParse(form)
if (!parsed.success) { setErros(parsed.error.flatten().fieldErrors); return }
try { await api.post('/login', parsed.data) }
catch (e) { if (e instanceof ApiError && e.errors) setErros(e.errors); else toast.erro((e as Error).message) }
```

## Navegação

`import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'`.
Use `<Link to>` em vez de `<a href>`. Rotas já registradas no router (não altere).

## Visual — estilos inline + tokens de tema

- **Sem classes CSS de framework, sem `className` utilitário.** Estilize via `style={{...}}`.
- Cores e fontes vêm de `@/lib/theme`:
  ```ts
  import { colors, fonts, statusColors, selectArrow } from '@/lib/theme'
  // <h1 style={{ fontFamily: fonts.heading, color: colors.inkStrong }}>...</h1>
  // <select style={{ ...selectArrow }}> — chevron custom já desenhado
  ```
- **Ícones**: SVG inline (`<svg viewBox=... />`), nunca fonte de ícones (`bi bi-*` não existe).
- Cada página replica o `.jsx` correspondente em `design/girochoffer-react/src/pages/` —
  leia o protótipo da sua área antes de implementar e mantenha títulos/textos/estrutura.
- Padrão de página: container com `maxWidth` + `margin: '0 auto'` + `padding`, título `h1`
  com `fonts.heading`, subtítulo `p` com `colors.muted`. Veja `MotoristaMinhasPage.tsx` como modelo.

## Regras de saída

- Cada página é **default export**, nome do componente = nome do arquivo.
- TypeScript **strict** + `noUnusedLocals/Parameters`: não deixe imports/vars sem uso.
- Não use `any` implícito; tipe tudo. O build roda `tsc -b` — precisa passar.
