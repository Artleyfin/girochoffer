import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import CargaCardMercado from '../components/CargaCardMercado.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { colors, fonts, selectArrow } from '../utils/theme.js';

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: `1px solid ${colors.borderInput}`,
  borderRadius: '9px',
  fontSize: '14px',
  background: '#fff',
};
const lblStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' };

export default function MotoristaPainel() {
  const { cargas, opcoes } = useApp();
  const [filtro, setFiltro] = useState({ origem: '', destino: '', carroceria: '' });

  const set = (k) => (e) => setFiltro((f) => ({ ...f, [k]: e.target.value }));
  const limpar = () => setFiltro({ origem: '', destino: '', carroceria: '' });

  let market = cargas.filter((c) => c.status === 'Disponível');
  if (filtro.origem.trim()) market = market.filter((c) => c.origem.toLowerCase().includes(filtro.origem.toLowerCase().trim()));
  if (filtro.destino.trim()) market = market.filter((c) => c.destino.toLowerCase().includes(filtro.destino.toLowerCase().trim()));
  if (filtro.carroceria) market = market.filter((c) => c.carroceria === filtro.carroceria);

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, margin: '0 0 4px' }}>Cargas disponíveis</h1>
      <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '15px' }}>Encontre fretes compatíveis e demonstre seu interesse.</p>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={lblStyle}>Origem</label>
          <input value={filtro.origem} onChange={set('origem')} placeholder="Cidade ou UF" style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={lblStyle}>Destino</label>
          <input value={filtro.destino} onChange={set('destino')} placeholder="Cidade ou UF" style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={lblStyle}>Carroceria</label>
          <select value={filtro.carroceria} onChange={set('carroceria')} style={{ ...inputStyle, ...selectArrow }}>
            <option value="">Todas as carrocerias</option>
            {opcoes.carrocerias.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <button onClick={limpar} style={{ padding: '10px 18px', background: '#F1F4F8', color: colors.muted, border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', height: '40px' }}>
          Limpar
        </button>
      </div>

      <div style={{ fontSize: '14px', color: colors.muted, marginBottom: '14px' }}>{market.length} carga(s) encontrada(s)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {market.map((c) => (
          <CargaCardMercado key={c.id} carga={c} />
        ))}
      </div>
      {market.length === 0 && <EmptyState>Nenhuma carga corresponde aos filtros.</EmptyState>}
    </div>
  );
}
