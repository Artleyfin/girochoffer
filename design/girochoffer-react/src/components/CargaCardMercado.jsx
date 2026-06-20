import { useNavigate } from 'react-router';
import StatusBadge from './StatusBadge.jsx';
import Button from './Button.jsx';
import { cargaVM } from '../utils/cargaVm.js';
import { useApp } from '../context/AppContext.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Card em grade usado na vitrine de cargas do motorista. */
export default function CargaCardMercado({ carga }) {
  const navigate = useNavigate();
  const { motoristas } = useApp();
  const item = cargaVM(carga, motoristas);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <StatusBadge label={item.statusLabel} />
        <span style={{ fontSize: '12px', color: colors.muted2 }}>Coleta {item.dataColeta}</span>
      </div>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: '17px', color: colors.ink, marginBottom: '6px' }}>
        {item.titulo}
      </div>
      <div style={{ fontSize: '13px', color: colors.muted, marginBottom: '12px' }}>{item.empresa}</div>
      <div style={{ fontSize: '15px', color: '#4A5462', marginBottom: '6px' }}>
        <span style={{ fontWeight: 700, color: colors.navy }}>{item.origem}</span> →{' '}
        <span style={{ fontWeight: 700, color: colors.navy }}>{item.destino}</span>
      </div>
      <div style={{ fontSize: '13px', color: colors.muted, marginBottom: '16px' }}>
        {item.carroceria} · {item.peso}
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
          onClick={() => navigate(`/motorista/carga/${item.id}`)}
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
  );
}
