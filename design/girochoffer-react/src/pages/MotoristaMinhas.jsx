import { useApp } from '../context/AppContext.jsx';
import CargaResumoRow from '../components/CargaResumoRow.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { colors, fonts } from '../utils/theme.js';

function Secao({ titulo, cor, children }) {
  return (
    <>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: '15px', color: cor, marginBottom: '12px' }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>{children}</div>
    </>
  );
}

export default function MotoristaMinhas() {
  const { cargas, currentMotorista } = useApp();
  const me = currentMotorista;

  const enviados = cargas.filter((c) => c.interessados.includes(me) && c.escolhido !== me && c.status === 'Disponível');
  const contratadas = cargas.filter((c) => c.escolhido === me && c.status === 'Contratada');
  const concluidas = cargas.filter((c) => c.escolhido === me && c.status === 'Concluída');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, margin: '0 0 4px' }}>Minhas cargas</h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>Acompanhe seus interesses, fretes contratados e o histórico.</p>

      <Secao titulo="Interesse enviado" cor="#B7791F">
        {enviados.length === 0 && (
          <EmptyState padding="24px" radius="12px">Você ainda não demonstrou interesse em nenhuma carga.</EmptyState>
        )}
        {enviados.map((c) => (
          <CargaResumoRow key={c.id} carga={c} pill={{ label: 'Aguardando empresa', bg: '#FBF1E0', color: '#B7791F' }} verButton />
        ))}
      </Secao>

      <Secao titulo="Contratadas" cor="#1E8E5A">
        {contratadas.length === 0 && (
          <EmptyState padding="24px" radius="12px">Nenhum frete contratado no momento.</EmptyState>
        )}
        {contratadas.map((c) => (
          <CargaResumoRow key={c.id} carga={c} borderColor="#CDE8D9" pill={{ label: 'Contratada', bg: '#E3F4EC', color: '#1E8E5A' }} />
        ))}
      </Secao>

      <Secao titulo="Concluídas" cor={colors.muted3}>
        {concluidas.length === 0 && (
          <EmptyState padding="24px" radius="12px">Nenhum frete concluído ainda.</EmptyState>
        )}
        {concluidas.map((c) => (
          <CargaResumoRow key={c.id} carga={c} dimmed pill={{ label: 'Concluída', bg: '#EDF0F4', color: colors.muted3 }} />
        ))}
      </Secao>
    </div>
  );
}
