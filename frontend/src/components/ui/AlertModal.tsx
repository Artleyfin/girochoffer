import type { CSSProperties } from 'react'
import { useUIStore } from '../../store/uiStore'
import { colors, fonts } from '@/lib/theme'

/* Modal de alerta global (inline, sem Bootstrap): overlay + card central. */

const CORES: Record<string, string> = {
  danger: '#C0392B',
  warning: '#B7791F',
  info: '#1284D7',
  success: '#1E8E5A',
}
const SIMBOLO: Record<string, string> = { danger: '!', warning: '!', info: 'i', success: '✓' }

export default function AlertModal() {
  const alert = useUIStore((s) => s.alert)
  const fechar = useUIStore((s) => s.fecharAlerta)
  if (!alert) return null

  const tipo = alert.tipo ?? 'info'
  const cor = CORES[tipo] ?? CORES.info

  return (
    <div style={overlay} onClick={fechar}>
      <div style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{ ...header, background: cor }}>
          <span style={badge}>{SIMBOLO[tipo] ?? 'i'}</span>
          <h5 style={titulo}>{alert.titulo ?? 'Aviso'}</h5>
        </div>
        <div style={body}>
          <p style={{ margin: 0, color: colors.ink, fontSize: 15, lineHeight: 1.5 }}>{alert.mensagem}</p>
          {alert.detalhes && (
            <p style={{ margin: '12px 0 0', color: colors.muted, fontSize: 13, lineHeight: 1.5 }}>{alert.detalhes}</p>
          )}
        </div>
        <div style={footer}>
          <button type="button" onClick={fechar} style={{ ...btnFechar, background: cor, borderColor: cor }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,27,43,.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
}
const card: CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 460,
  overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(11,27,43,.35)',
  fontFamily: fonts.body,
}
const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 22px',
  color: '#fff',
}
const badge: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  background: 'rgba(255,255,255,.25)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 15,
  flex: 'none',
}
const titulo: CSSProperties = { margin: 0, fontFamily: fonts.heading, fontWeight: 700, fontSize: 17 }
const body: CSSProperties = { padding: '22px' }
const footer: CSSProperties = { display: 'flex', justifyContent: 'flex-end', padding: '0 22px 22px' }
const btnFechar: CSSProperties = {
  padding: '10px 18px',
  color: '#fff',
  border: '1px solid',
  borderRadius: 9,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}
