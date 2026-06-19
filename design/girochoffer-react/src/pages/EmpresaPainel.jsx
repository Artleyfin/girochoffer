import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import CargaCardEmpresa from '../components/CargaCardEmpresa.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import { dispStatus } from '../utils/format.js';
import { colors, fonts } from '../utils/theme.js';

const tabDefs = [
  ['todas', 'Todas'],
  ['Disponível', 'Disponíveis'],
  ['Com interessados', 'Com interessados'],
  ['Contratada', 'Contratadas'],
  ['Concluída', 'Concluídas'],
];

function StatCard({ value, label, color }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '32px', color }}>{value}</div>
      <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export default function EmpresaPainel() {
  const navigate = useNavigate();
  const { cargas } = useApp();
  const [tab, setTab] = useState('todas');

  const mine = cargas.filter((c) => c.mine);
  const stats = {
    disp: mine.filter((c) => c.status === 'Disponível' && c.interessados.length === 0).length,
    inter: mine.filter((c) => c.status === 'Disponível' && c.interessados.length > 0).length,
    contr: mine.filter((c) => c.status === 'Contratada').length,
    concl: mine.filter((c) => c.status === 'Concluída').length,
  };

  let list = mine;
  if (tab !== 'todas') list = mine.filter((c) => dispStatus(c) === tab);

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, margin: '0 0 4px' }}>Painel da empresa</h1>
          <p style={{ margin: 0, color: colors.muted, fontSize: '15px' }}>Acompanhe suas cargas publicadas e os motoristas interessados.</p>
        </div>
        <Button onClick={() => navigate('/empresa/nova')} style={{ padding: '13px 24px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '11px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
          + Publicar nova carga
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
        <StatCard value={stats.disp} label="Disponíveis" color={colors.primary} />
        <StatCard value={stats.inter} label="Com interessados" color="#B7791F" />
        <StatCard value={stats.contr} label="Contratadas" color="#1E8E5A" />
        <StatCard value={stats.concl} label="Concluídas" color={colors.muted3} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabDefs.map(([key, label]) => {
          const on = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: `1px solid ${on ? colors.primary : colors.border}`,
                background: on ? colors.primary : '#fff',
                color: on ? '#fff' : colors.muted3,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {list.map((c) => (
          <CargaCardEmpresa key={c.id} carga={c} />
        ))}
      </div>
      {list.length === 0 && <EmptyState>Nenhuma carga neste status.</EmptyState>}
    </div>
  );
}
