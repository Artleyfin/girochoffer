import type { CSSProperties } from 'react'
import { colors } from '@/lib/theme'

/* Indicador de carregamento centralizado (inline, sem Bootstrap). */
export default function Spinner({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div style={wrap} role="status" aria-live="polite">
      <span style={anel} />
      {texto && <p style={legenda}>{texto}</p>}
    </div>
  )
}

const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: '40px 0',
}
const anel: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: `3px solid ${colors.border}`,
  borderTopColor: colors.primary,
  animation: 'gc_spin .7s linear infinite',
}
const legenda: CSSProperties = {
  margin: 0,
  color: colors.muted,
  fontSize: 14,
}
