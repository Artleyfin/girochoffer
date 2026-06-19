import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import CargaDetalheCard from '../components/CargaDetalheCard.jsx';
import MotoristaInteressadoCard from '../components/MotoristaInteressadoCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fmt, dispStatus } from '../utils/format.js';
import { colors, fonts } from '../utils/theme.js';

export default function EmpresaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cargas, motoristas, escolher, concluir, cancelarCarga } = useApp();

  const carga = cargas.find((c) => c.id === id) || cargas[0];
  const statusLabel = dispStatus(carga);
  const isContratada = carga.status === 'Contratada';
  const isDisponivel = carga.status === 'Disponível';

  const interessados = carga.interessados.map((mid) => motoristas[mid]).filter(Boolean);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button onClick={() => navigate('/empresa')} style={{ background: 'none', border: 'none', color: colors.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Voltar ao painel
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <CargaDetalheCard carga={carga} statusLabel={statusLabel} />

        <div>
          <div style={{ background: colors.navy, borderRadius: '16px', padding: '26px', color: '#fff', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', color: '#9FC2E0', marginBottom: '4px' }}>Valor do frete</div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: '36px', lineHeight: 1 }}>{fmt(carga.valor)}</div>
          </div>

          {isContratada && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E8E5A', marginBottom: '12px' }}>✓ Carga contratada</div>
              <button onClick={() => concluir(carga.id)} style={{ width: '100%', padding: '13px', background: '#1E8E5A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginBottom: '10px' }}>
                Marcar como concluída
              </button>
              <button onClick={() => cancelarCarga(carga.id)} style={{ width: '100%', padding: '13px', background: '#fff', color: '#C0392B', border: '1px solid #F0D2CE', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Cancelar carga
              </button>
            </div>
          )}
          {isDisponivel && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
              <button onClick={() => cancelarCarga(carga.id)} style={{ width: '100%', padding: '13px', background: '#fff', color: '#C0392B', border: '1px solid #F0D2CE', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Cancelar carga
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '20px', color: colors.inkStrong, margin: '0 0 16px' }}>Motoristas interessados</h2>
        {interessados.length === 0 ? (
          <EmptyState padding="40px">Ainda não há motoristas interessados nesta carga.</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {interessados.map((m) => (
              <MotoristaInteressadoCard
                key={m.id}
                motorista={m}
                escolhido={carga.escolhido === m.id}
                podeEscolher={!carga.escolhido}
                onEscolher={() => escolher(carga.id, m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
