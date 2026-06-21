import type { CSSProperties } from 'react'
import { statusColors } from '@/lib/theme'

/* Estilo inline para o badge de status (portado de utils/format.js:statusStyle). */
export function statusStyle(label: string): CSSProperties {
  const c = (statusColors as Record<string, readonly [string, string]>)[label] ?? ['#5A6573', '#EDF0F4']
  return {
    color: c[0],
    background: c[1],
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'inline-block',
    whiteSpace: 'nowrap',
  }
}

/* Pílula de status reutilizável. Usa statusColors do theme. */
export default function StatusBadge({ label }: { label: string }) {
  return <span style={statusStyle(label)}>{label}</span>
}
