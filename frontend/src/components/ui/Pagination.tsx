import type { CSSProperties } from 'react'
import { colors, fonts } from '@/lib/theme'

/* Paginação no estilo GiroChoffer: pills inline (sem Bootstrap), com tokens do
   tema. Ativo = primary; desabilitado = esmaecido; reticências para saltos. */
export default function Pagination({
  pagina,
  totalPaginas,
  onPagina,
}: {
  pagina: number
  totalPaginas: number
  onPagina: (p: number) => void
}) {
  if (totalPaginas <= 1) return null

  const paginas: number[] = []
  const inicio = Math.max(1, pagina - 2)
  const fim = Math.min(totalPaginas, pagina + 2)
  for (let i = inicio; i <= fim; i++) paginas.push(i)

  return (
    <nav
      aria-label="Paginação"
      style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}
    >
      <button
        style={pagina <= 1 ? desativado : base}
        onClick={() => onPagina(pagina - 1)}
        disabled={pagina <= 1}
      >
        <Chevron dir="left" /> Anterior
      </button>

      {inicio > 1 && (
        <button style={base} onClick={() => onPagina(1)}>
          1
        </button>
      )}
      {inicio > 2 && <span style={reticencias}>…</span>}

      {paginas.map((p) => (
        <button
          key={p}
          style={p === pagina ? ativo : base}
          onClick={() => onPagina(p)}
          aria-current={p === pagina ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {fim < totalPaginas - 1 && <span style={reticencias}>…</span>}
      {fim < totalPaginas && (
        <button style={base} onClick={() => onPagina(totalPaginas)}>
          {totalPaginas}
        </button>
      )}

      <button
        style={pagina >= totalPaginas ? desativado : base}
        onClick={() => onPagina(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Próxima <Chevron dir="right" />
      </button>
    </nav>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  )
}

const base: CSSProperties = {
  minWidth: 38,
  height: 38,
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  border: `1px solid ${colors.borderInput}`,
  background: '#fff',
  color: colors.ink,
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 14,
  fontFamily: fonts.body,
  cursor: 'pointer',
}
const ativo: CSSProperties = {
  ...base,
  background: colors.primary,
  borderColor: colors.primary,
  color: '#fff',
  cursor: 'default',
}
const desativado: CSSProperties = {
  ...base,
  color: colors.muted2,
  cursor: 'not-allowed',
  opacity: 0.55,
}
const reticencias: CSSProperties = {
  minWidth: 38,
  height: 38,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.muted2,
  fontWeight: 700,
}
