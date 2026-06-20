import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import CargaDetalheCard from '../components/CargaDetalheCard.jsx';
import Button from '../components/Button.jsx';
import { fmt, dispStatus } from '../utils/format.js';
import { colors, fonts } from '../utils/theme.js';

export default function MotoristaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cargas, usuarios, currentMotorista, interesse } = useApp();

  const carga = cargas.find((c) => c.id === id) || cargas[0];
  const statusLabel = dispStatus(carga);

  const jaInteresse = carga.interessados.includes(currentMotorista);
  const podeInteresse = carga.status === 'Disponível' && !jaInteresse;
  const contatoLiberado = jaInteresse || carga.escolhido === currentMotorista;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button onClick={() => navigate('/motorista')} style={{ background: 'none', border: 'none', color: colors.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Voltar às cargas
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <CargaDetalheCard carga={carga} statusLabel={statusLabel} subtitulo={`Publicada por ${carga.empresa}`} />

        <div>
          <div style={{ background: colors.navy, borderRadius: '16px', padding: '26px', color: '#fff', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', color: '#9FC2E0', marginBottom: '4px' }}>Valor do frete</div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: '36px', lineHeight: 1 }}>{fmt(carga.valor)}</div>
          </div>

          {podeInteresse && (
            <Button onClick={() => interesse(carga.id)} style={{ width: '100%', padding: '16px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
              Tenho interesse
            </Button>
          )}

          {contatoLiberado && (
            <div style={{ background: '#fff', border: '1px solid #CDE8D9', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E8E5A', marginBottom: '12px' }}>✓ Interesse enviado — contato liberado</div>
              <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>Telefone</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.ink, marginBottom: '10px' }}>{usuarios.empresa.telefone}</div>
              <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>WhatsApp</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.ink, marginBottom: '16px' }}>{usuarios.empresa.whatsapp}</div>
              <button onClick={() => navigate('/motorista/minhas')} style={{ width: '100%', padding: '12px', background: '#fff', color: colors.primary, border: '1px solid #BBD9F1', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Ver em Minhas cargas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
