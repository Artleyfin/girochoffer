import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/lib/theme'

// Estado vazio com ícone (inline, sem Bootstrap). Para a caixa tracejada
// padrão use components/giro/EmptyState.
export default function EmptyState({
  titulo,
  mensagem,
  children,
}: {
  titulo: string
  mensagem?: string
  children?: ReactNode
}) {
  return (
    <div style={wrap}>
      <svg width="48" height="48" viewBox="0 0 16 16" fill="none" stroke={colors.muted2} strokeWidth="1" aria-hidden="true">
        <path d="M2 9.5 4 3h8l2 6.5M2 9.5V13h12V9.5M2 9.5h3.5l1 1.5h3l1-1.5H14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h5 style={tit5}>{titulo}</h5>
      {mensagem && <p style={msg}>{mensagem}</p>}
      {children}
    </div>
  )
}

const wrap: CSSProperties = {
  textAlign: 'center',
  color: colors.muted2,
  padding: '48px 0',
}
const tit5: CSSProperties = {
  margin: '12px 0 0',
  color: colors.muted3,
  fontSize: 16,
}
const msg: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
}
