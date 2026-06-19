import { useNavigate } from 'react-router-dom'
import type { CargaResumo } from '@/lib/types'
import StatusBadge from './StatusBadge'
import Button from './Button'
import { cargaVM } from './cargaVm'
import { colors, fonts } from '@/lib/theme'

/* Card em grade usado na vitrine de cargas do motorista.
   Portado de design/girochoffer-react/src/components/CargaCardMercado.jsx. */
export default function CargaCardMercado({ carga }: { carga: CargaResumo }) {
  const navigate = useNavigate()
  const item = cargaVM(carga)

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {carga.foto_url && (
        <img
          src={carga.foto_url}
          alt={carga.titulo}
          style={{
            width: 'calc(100% + 40px)',
            height: '150px',
            objectFit: 'cover',
            margin: '-20px -20px 14px',
            borderRadius: '14px 14px 0 0',
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <StatusBadge label={carga.status_rotulo} />
        <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {item.coletaLabel}</span>
      </div>
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: '17px',
          color: colors.ink,
          marginBottom: '6px',
        }}
      >
        {carga.titulo}
      </div>
      <div style={{ fontSize: '13px', color: colors.muted, marginBottom: '12px' }}>{carga.empresa_nome}</div>
      <div style={{ fontSize: '15px', color: '#4A5462', marginBottom: '6px' }}>
        <span style={{ fontWeight: 700, color: colors.navy }}>{carga.origem}</span> →{' '}
        <span style={{ fontWeight: 700, color: colors.navy }}>{carga.destino}</span>
      </div>
      <div style={{ fontSize: '13px', color: colors.muted, marginBottom: '16px' }}>
        {carga.carroceria} · {item.pesoLabel}
      </div>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '14px',
          borderTop: '1px solid #F0F2F5',
        }}
      >
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '20px', color: colors.navy }}>
          {item.valorFmt}
        </div>
        <Button
          onClick={() => navigate(`/motorista/carga/${carga.id}`)}
          style={{
            padding: '10px 20px',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
          hoverStyle={{ background: colors.primaryHover }}
        >
          Ver carga
        </Button>
      </div>
    </div>
  )
}
