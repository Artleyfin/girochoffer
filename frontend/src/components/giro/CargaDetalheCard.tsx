import type { ReactNode } from 'react'
import type { Carga } from '@/lib/types'
import StatusBadge from './StatusBadge'
import { cargaVM } from './cargaVm'
import { colors, fonts } from '@/lib/theme'

/* Cartão de detalhes da carga (coluna principal), compartilhado entre as
   telas de detalhe da empresa e do motorista.
   Portado de design/girochoffer-react/src/components/CargaDetalheCard.jsx. */

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: '12px',
          color: colors.muted2,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.4px',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '15px', color: colors.ink }}>{children}</div>
    </div>
  )
}

export default function CargaDetalheCard({
  carga,
  statusLabel,
  subtitulo,
}: {
  carga: Carga
  statusLabel: string
  subtitulo?: string
}) {
  const item = cargaVM(carga)
  const volumeLabel = carga.volume_m3 != null ? `${carga.volume_m3.toLocaleString('pt-BR')} m³` : '—'

  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '30px' }}>
      {carga.foto_url && (
        <img
          src={carga.foto_url}
          alt={carga.titulo}
          style={{
            width: 'calc(100% + 60px)',
            height: '220px',
            objectFit: 'cover',
            margin: '-30px -30px 22px',
            borderRadius: '16px 16px 0 0',
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <StatusBadge label={statusLabel} />
        <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {item.coletaLabel}</span>
      </div>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '26px',
          color: colors.inkStrong,
          margin: subtitulo ? '0 0 4px' : '0 0 22px',
        }}
      >
        {carga.titulo}
      </h1>
      {subtitulo && <div style={{ fontSize: '14px', color: colors.muted, marginBottom: '24px' }}>{subtitulo}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
        <Campo label="Origem">
          <span style={{ fontSize: '16px', fontWeight: 700, color: colors.navy }}>{carga.origem}</span>
        </Campo>
        <Campo label="Destino">
          <span style={{ fontSize: '16px', fontWeight: 700, color: colors.navy }}>{carga.destino}</span>
        </Campo>
        <Campo label="Veículo / Carroceria">
          {carga.tipo_veiculo} · {carga.carroceria}
        </Campo>
        <Campo label="Peso / Volume">
          {item.pesoLabel} · {volumeLabel}
        </Campo>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: colors.muted2,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.4px',
          marginBottom: '6px',
        }}
      >
        Descrição
      </div>
      <p style={{ fontSize: '15px', color: '#4A5462', lineHeight: 1.6, margin: 0 }}>{carga.descricao}</p>
    </div>
  )
}
