import { useNavigate } from 'react-router-dom'
import type { CargaResumo } from '@/lib/types'
import StatusBadge from './StatusBadge'
import Button from './Button'
import { cargaVM } from './cargaVm'
import { colors, fonts } from '@/lib/theme'

/* Card em formato de linha usado no painel da empresa.
   Portado de design/girochoffer-react/src/components/CargaCardEmpresa.jsx. */
export default function CargaCardEmpresa({ carga }: { carga: CargaResumo }) {
  const navigate = useNavigate()
  const item = cargaVM(carga)

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      {carga.foto_url && (
        <img
          src={carga.foto_url}
          alt={carga.titulo}
          style={{ width: '84px', height: '64px', objectFit: 'cover', borderRadius: '10px', flex: 'none' }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <StatusBadge label={carga.status_rotulo} />
          <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {item.coletaLabel}</span>
        </div>
        <div
          style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: '17px',
            color: colors.ink,
            marginBottom: '8px',
          }}
        >
          {carga.titulo}
        </div>
        <div style={{ fontSize: '14px', color: '#4A5462' }}>
          <span style={{ fontWeight: 700, color: colors.navy }}>{carga.origem}</span> →{' '}
          <span style={{ fontWeight: 700, color: colors.navy }}>{carga.destino}</span>
          <span style={{ color: '#C2C9D2' }}>{'  ·  '}</span>
          {carga.carroceria}
          <span style={{ color: '#C2C9D2' }}>{'  ·  '}</span>
          {item.pesoLabel}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '21px', color: colors.navy }}>
          {item.valorFmt}
        </div>
        <div style={{ fontSize: '12px', color: colors.muted, margin: '4px 0 12px' }}>
          {item.interessadosLabel}
        </div>
        <Button
          onClick={() => navigate(`/empresa/carga/${carga.id}`)}
          style={{
            padding: '9px 18px',
            background: '#fff',
            color: colors.ink,
            border: `1px solid ${colors.borderInput}`,
            borderRadius: '9px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
          hoverStyle={{ borderColor: colors.primary, color: colors.primary }}
        >
          Ver detalhes
        </Button>
      </div>
    </div>
  )
}
