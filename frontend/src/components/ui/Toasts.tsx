import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useUIStore, type Toast } from '../../store/uiStore'

/* Toasts no estilo GiroChoffer (inline, sem Bootstrap). Container fixo embaixo
   ao centro; cada toast tem cor por tipo e some sozinho em 5s. */

const CORES: Record<string, string> = {
  success: '#1E8E5A',
  danger: '#C0392B',
  warning: '#B7791F',
  info: '#1284D7',
}
const SIMBOLO: Record<string, string> = {
  success: '✓',
  danger: '!',
  warning: '!',
  info: 'i',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removerToast = useUIStore((s) => s.removerToast)
  useEffect(() => {
    const t = setTimeout(() => removerToast(toast.id), 5000)
    return () => clearTimeout(t)
  }, [toast.id, removerToast])

  const cor = CORES[toast.tipo] ?? CORES.info
  return (
    <div role="alert" style={{ ...card, background: cor }}>
      <span style={badge}>{SIMBOLO[toast.tipo] ?? 'i'}</span>
      <span style={{ flex: 1 }}>{toast.mensagem}</span>
      <button onClick={() => removerToast(toast.id)} aria-label="Fechar" style={fechar}>
        ×
      </button>
    </div>
  )
}

export default function Toasts() {
  const toasts = useUIStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div style={container}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

const container: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 24,
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  zIndex: 9999,
  width: 'min(92vw, 440px)',
  pointerEvents: 'none',
}
const card: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  color: '#fff',
  padding: '13px 16px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "'Public Sans', system-ui, sans-serif",
  boxShadow: '0 12px 32px rgba(11,27,43,.28)',
  animation: 'gc_toast .22s ease-out',
  pointerEvents: 'auto',
}
const badge: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: 'rgba(255,255,255,.25)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 800,
  flex: 'none',
}
const fechar: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,.85)',
  fontSize: 20,
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0,
  flex: 'none',
}
