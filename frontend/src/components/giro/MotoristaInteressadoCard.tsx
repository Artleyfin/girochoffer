import type { MotoristaResumo } from '@/lib/types'
import Button from './Button'
import { colors, fonts } from '@/lib/theme'

/* Card de motorista interessado, exibido nos detalhes da carga (empresa).
   Portado de design/girochoffer-react/src/components/MotoristaInteressadoCard.jsx. */
export default function MotoristaInteressadoCard({
  motorista,
  escolhido = false,
  podeEscolher = false,
  onEscolher,
}: {
  motorista: MotoristaResumo
  escolhido?: boolean
  podeEscolher?: boolean
  onEscolher?: () => void
}) {
  const m = motorista
  const inicial = (m.nome.trim()[0] ?? '?').toUpperCase()
  const capLabel = `${m.capacidade_kg.toLocaleString('pt-BR')} kg`

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
      {m.foto_url ? (
        <img
          src={m.foto_url}
          alt={m.nome}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
        />
      ) : (
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
          {inicial}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: colors.ink, marginBottom: '3px' }}>{m.nome}</div>
        <div style={{ fontSize: '13px', color: colors.muted }}>
          {m.veiculo_principal} · {m.carroceria} · até {capLabel}
        </div>
        <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>
          {m.cidade ?? 'Cidade não informada'} · ⭐ {m.nota} · {m.total_viagens} viagens
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
  )
}
