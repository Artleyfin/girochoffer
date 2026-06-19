import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/Button.jsx';
import { colors, fonts } from '../utils/theme.js';

const steps = [
  { n: '1', t: 'Empresa publica a carga', d: 'Origem, destino, valor e tipo de carroceria em poucos minutos.' },
  { n: '2', t: 'Motoristas têm interesse', d: 'Quem está na rota demonstra interesse com um clique.' },
  { n: '3', t: 'Empresa escolhe', d: 'Avalia os interessados e contrata o motorista ideal.' },
  { n: '4', t: 'Frete realizado', d: 'Contato liberado, carga transportada e marcada como concluída.' },
];

const benefEmpresa = [
  'Publique cargas em minutos, sem burocracia.',
  'Receba motoristas interessados e compatíveis.',
  'Escolha pelo veículo, carroceria e avaliação.',
  'Acompanhe o status de cada carga em um só lugar.',
];

const benefMotorista = [
  'Encontre fretes disponíveis na sua rota.',
  'Filtre por origem, destino e tipo de carroceria.',
  'Demonstre interesse com um único clique.',
  'Fale direto com a empresa após o interesse.',
];

const stats = [
  ['+2.400', 'motoristas ativos'],
  ['+850', 'empresas cadastradas'],
  ['27', 'estados atendidos'],
];

export default function Landing() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const year = 2026;

  const goCad = () => navigate('/entrar?modo=cadastro');

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: fonts.body, color: colors.text }}>
      <header style={{ height: '72px', maxWidth: '1160px', margin: '0 auto', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <img src="/assets/giro_logo.svg" alt="" style={{ height: '50px', width: 'auto', display: 'block' }} />
          <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '38px', width: 'auto', display: 'block' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/entrar?modo=login')} style={{ padding: '11px 20px', background: 'transparent', border: 'none', color: colors.ink, fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
            Entrar
          </button>
          <Button onClick={goCad} style={{ padding: '11px 22px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
            Criar conta
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '1160px', margin: '0 auto', padding: '56px 32px 64px', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: '56px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', background: colors.tintBlue, color: colors.tintBlueText, fontWeight: 700, fontSize: '13px', padding: '6px 14px', borderRadius: '999px', marginBottom: '22px' }}>
            Marketplace de fretes
          </div>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: '52px', lineHeight: 1.06, color: colors.inkStrong, margin: '0 0 20px', letterSpacing: '-1px' }}>
            Sua carga conectada ao motorista certo.
          </h1>
          <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#4A5462', margin: '0 0 32px', maxWidth: '520px' }}>
            O GiroChoffer aproxima empresas que precisam transportar cargas e motoristas que buscam fretes — de forma simples, direta e sem intermediários.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/entrar?modo=cadastro&papel=empresa')} style={{ padding: '15px 30px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
              Sou empresa
            </Button>
            <Button onClick={() => navigate('/entrar?modo=cadastro&papel=motorista')} style={{ padding: '15px 30px', background: colors.navy, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} hoverStyle={{ background: colors.navyHover }}>
              Sou motorista
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
            {stats.map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '26px', color: colors.navy }}>{v}</div>
                <div style={{ fontSize: '13px', color: colors.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ aspectRatio: '4 / 3', borderRadius: '18px', background: 'repeating-linear-gradient(135deg,#E9EEF4 0 14px,#EFF3F7 14px 28px)', border: `1px solid ${colors.borderSoft}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#8A95A3', background: '#fff', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${colors.borderSoft}` }}>
            [ foto: caminhão na estrada ]
          </div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#A7B0BC' }}>1200 × 900</div>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '60px 32px' }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, textAlign: 'center', margin: '0 0 8px' }}>Como funciona</h2>
          <p style={{ textAlign: 'center', color: colors.muted, fontSize: '16px', margin: '0 0 44px' }}>Do anúncio da carga ao frete concluído em quatro passos.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
            {steps.map((step) => (
              <div key={step.n} style={{ textAlign: 'center', padding: '0 8px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: colors.tintBlue, color: colors.primary, fontFamily: fonts.heading, fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{step.n}</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: colors.ink, marginBottom: '6px' }}>{step.t}</div>
                <div style={{ fontSize: '14px', color: colors.muted, lineHeight: 1.5 }}>{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para empresas / motoristas */}
      <section style={{ maxWidth: '1160px', margin: '0 auto', padding: '64px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '34px' }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '13px', letterSpacing: '.5px', color: colors.primary, textTransform: 'uppercase', marginBottom: '14px' }}>Para empresas</div>
          <h3 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 18px' }}>Encontre quem transporta sua carga</h3>
          {benefEmpresa.map((b) => (
            <div key={b} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.primary, marginTop: '7px', flex: 'none' }} />
              <div style={{ fontSize: '15px', color: colors.text }}>{b}</div>
            </div>
          ))}
          <Button onClick={() => navigate('/entrar?modo=cadastro&papel=empresa')} style={{ marginTop: '14px', padding: '13px 26px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
            Publicar uma carga
          </Button>
        </div>
        <div style={{ background: colors.navy, borderRadius: '16px', padding: '34px', color: '#fff' }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '13px', letterSpacing: '.5px', color: '#7FC0EE', textTransform: 'uppercase', marginBottom: '14px' }}>Para motoristas</div>
          <h3 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: '#fff', margin: '0 0 18px' }}>Frete na sua rota, sem complicação</h3>
          {benefMotorista.map((b) => (
            <div key={b} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7FC0EE', marginTop: '7px', flex: 'none' }} />
              <div style={{ fontSize: '15px', color: '#D6E4F2' }}>{b}</div>
            </div>
          ))}
          <button onClick={() => navigate('/entrar?modo=cadastro&papel=motorista')} style={{ marginTop: '14px', padding: '13px 26px', background: '#fff', color: colors.navy, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
            Buscar fretes
          </button>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ background: '#fff', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 32px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>Receba novidades e fretes em alta</h3>
          <p style={{ color: colors.muted, margin: '0 0 24px' }}>Cadastre seu e-mail e fique por dentro das novidades do GiroChoffer.</p>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '460px', margin: '0 auto' }}>
            <input type="email" placeholder="seu@email.com.br" style={{ flex: 1, padding: '13px 16px', border: `1px solid ${colors.borderInput}`, borderRadius: '10px', fontSize: '15px', background: '#fff' }} />
            <button onClick={() => showToast('Inscrição realizada! Você receberá nossas novidades.')} style={{ padding: '13px 24px', background: colors.navy, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Inscrever
            </button>
          </div>
        </div>
      </section>

      <footer style={{ background: colors.navyDeep, color: '#9AA7B6' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/assets/giro_logo_branco.svg" alt="" style={{ height: '28px', width: 'auto', display: 'block' }} />
            <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '20px', width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontSize: '13px' }}>© {year} GiroChoffer · Marketplace de fretes · Termos de uso · Privacidade</div>
        </div>
      </footer>
    </div>
  );
}
