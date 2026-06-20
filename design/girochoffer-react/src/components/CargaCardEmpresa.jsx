import { useNavigate } from 'react-router';
import StatusBadge from './StatusBadge.jsx';
import Button from './Button.jsx';
import { cargaVM } from '../utils/cargaVm.js';
import { useApp } from '../context/AppContext.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Card em formato de linha usado no painel da empresa. */
export default function CargaCardEmpresa({ carga }) {
  const navigate = useNavigate();
  const { motoristas } = useApp();
  const item = cargaVM(carga, motoristas);

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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <StatusBadge label={item.statusLabel} />
          <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {item.dataColeta}</span>
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
          {item.titulo}
        </div>
        <div style={{ fontSize: '14px', color: '#4A5462' }}>
          <span style={{ fontWeight: 700, color: colors.navy }}>{item.origem}</span> →{' '}
          <span style={{ fontWeight: 700, color: colors.navy }}>{item.destino}</span>
          <span style={{ color: '#C2C9D2' }}>{'  ·  '}</span>
          {item.carroceria}
          <span style={{ color: '#C2C9D2' }}>{'  ·  '}</span>
          {item.peso}
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
          onClick={() => navigate(`/empresa/carga/${item.id}`)}
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
  );
}
