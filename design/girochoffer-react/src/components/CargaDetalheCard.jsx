import StatusBadge from './StatusBadge.jsx';
import { colors, fonts } from '../utils/theme.js';

function Campo({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: colors.muted2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '15px', color: colors.ink }}>{children}</div>
    </div>
  );
}

/* Cartão de detalhes da carga (coluna principal), compartilhado entre
   as telas de detalhe da empresa e do motorista. */
export default function CargaDetalheCard({ carga, statusLabel, subtitulo }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <StatusBadge label={statusLabel} />
        <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {carga.dataColeta}</span>
      </div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '26px', color: colors.inkStrong, margin: subtitulo ? '0 0 4px' : '0 0 22px' }}>
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
          {carga.tipoVeiculo} · {carga.carroceria}
        </Campo>
        <Campo label="Peso / Volume">
          {carga.peso} · {carga.volume}
        </Campo>
      </div>

      <div style={{ fontSize: '12px', color: colors.muted2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '6px' }}>
        Descrição
      </div>
      <p style={{ fontSize: '15px', color: '#4A5462', lineHeight: 1.6, margin: 0 }}>{carga.descricao}</p>
    </div>
  );
}
