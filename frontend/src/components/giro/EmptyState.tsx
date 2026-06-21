import type { ReactNode } from 'react'
import { colors } from '@/lib/theme'

/* Estado vazio padrão (caixa tracejada com mensagem), no estilo do design.
   Para o EmptyState Bootstrap (com ícone) use components/ui/EmptyState. */
export default function EmptyState({
  children,
  padding = '48px',
  radius = '14px',
}: {
  children: ReactNode
  padding?: string
  radius?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px dashed ${colors.borderInput}`,
        borderRadius: radius,
        padding,
        textAlign: 'center',
        color: colors.muted2,
        fontSize: '14px',
      }}
    >
      {children}
    </div>
  )
}
