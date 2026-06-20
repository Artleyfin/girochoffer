import { useNavigate } from 'react-router';
import { fmt } from '../utils/format.js';
import { colors } from '../utils/theme.js';

/* Linha compacta de carga usada em "Minhas cargas" (motorista).
   `pill` define o rótulo/cores do status e `verButton` exibe o botão Ver. */
export default function CargaResumoRow({ carga, pill, borderColor = colors.border, dimmed = false, verButton = false }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${borderColor}`,
        borderRadius: '13px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        opacity: dimmed ? 0.86 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: colors.ink, marginBottom: '4px' }}>{carga.titulo}</div>
        <div style={{ fontSize: '14px', color: '#4A5462' }}>
          <span style={{ fontWeight: 700, color: colors.navy }}>{carga.origem}</span> →{' '}
          <span style={{ fontWeight: 700, color: colors.navy }}>{carga.destino}</span> · {carga.empresa}
        </div>
      </div>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: '18px', color: colors.navy }}>
        {fmt(carga.valor)}
      </div>
      <span
        style={{
          background: pill.bg,
          color: pill.color,
          fontWeight: 700,
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '999px',
        }}
      >
        {pill.label}
      </span>
      {verButton && (
        <button
          onClick={() => navigate(`/motorista/carga/${carga.id}`)}
          style={{
            padding: '9px 16px',
            background: '#fff',
            color: colors.ink,
            border: `1px solid ${colors.borderInput}`,
            borderRadius: '9px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Ver
        </button>
      )}
    </div>
  );
}
