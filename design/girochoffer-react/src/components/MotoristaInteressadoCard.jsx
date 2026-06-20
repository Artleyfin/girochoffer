import Button from './Button.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Card de motorista interessado, exibido nos detalhes da carga (empresa). */
export default function MotoristaInteressadoCard({ motorista, escolhido, podeEscolher, onEscolher }) {
  const m = motorista;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${escolhido ? '#CDE8D9' : colors.border}`,
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: colors.tintBlue,
          color: colors.navy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '16px',
          fontFamily: fonts.heading,
          flex: 'none',
        }}
      >
        {m.inicial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: colors.ink, marginBottom: '3px' }}>{m.nome}</div>
        <div style={{ fontSize: '13px', color: colors.muted }}>
          {m.veiculo} · {m.carroceria} · até {m.cap}
        </div>
        <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>
          {m.cidade} · ⭐ {m.nota} · {m.viagens} viagens
        </div>
      </div>
      {escolhido && (
        <span
          style={{
            background: '#E3F4EC',
            color: '#1E8E5A',
            fontWeight: 700,
            fontSize: '13px',
            padding: '9px 16px',
            borderRadius: '9px',
            flex: 'none',
          }}
        >
          ✓ Contratado
        </span>
      )}
      {podeEscolher && (
        <Button
          onClick={onEscolher}
          style={{
            padding: '11px 22px',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            flex: 'none',
          }}
          hoverStyle={{ background: colors.primaryHover }}
        >
          Escolher
        </Button>
      )}
    </div>
  );
}
