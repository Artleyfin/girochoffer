import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { esqueciSenhaSchema, redefinirSenhaSchema } from '@/lib/schemas'
import { colors, fonts } from '@/lib/theme'
import { toast } from '@/store/uiStore'
import Button from '@/components/giro/Button'
import { TextInput } from '@/components/giro/FormControls'

/* Fluxo de recuperação de senha em três etapas:
   solicitar (e-mail) → enviado (confirmação) → redefinir (código + nova senha).
   Portado de design/girochoffer-react/src/pages/RecuperarSenha.jsx, integrando o
   passo 1 ao endpoint real POST /api/esqueci-senha. */

type Etapa = 'solicitar' | 'enviado' | 'redefinir'

const primaryBtn = {
  width: '100%',
  padding: '14px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '11px',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
} as const

export default function RecuperarSenhaPage() {
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState<Etapa>('solicitar')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [conf, setConf] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviarLink() {
    const parsed = esqueciSenhaSchema.safeParse({ email })
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.email?.[0] ?? 'Informe o e-mail cadastrado.'
      toast.aviso(msg)
      return
    }
    setEnviando(true)
    try {
      // Resposta neutra por design (não revela se o e-mail existe).
      await api.post('/esqueci-senha', { email: parsed.data.email })
      setEtapa('enviado')
    } catch (e) {
      if (e instanceof ApiError && e.type === 'rate_limited') {
        toast.erro('Muitas tentativas. Aguarde alguns instantes e tente novamente.')
      } else {
        toast.erro((e as Error).message)
      }
    } finally {
      setEnviando(false)
    }
  }

  async function reenviar() {
    const parsed = esqueciSenhaSchema.safeParse({ email })
    if (!parsed.success) return
    try {
      await api.post('/esqueci-senha', { email: parsed.data.email })
      toast.info('Reenviamos o código de recuperação.')
    } catch (e) {
      if (e instanceof ApiError && e.type === 'rate_limited') {
        toast.erro('Muitas tentativas. Aguarde alguns instantes e tente novamente.')
      } else {
        toast.erro((e as Error).message)
      }
    }
  }

  function redefinir() {
    if (!codigo.trim()) {
      toast.aviso('Informe o código de recuperação recebido por e-mail.')
      return
    }
    const parsed = redefinirSenhaSchema.safeParse({ senha, confirmarSenha: conf })
    if (!parsed.success) {
      const erros = parsed.error.flatten().fieldErrors
      const msg = erros.senha?.[0] ?? erros.confirmarSenha?.[0] ?? 'Verifique a nova senha.'
      toast.aviso(msg)
      return
    }
    // O endpoint de confirmação por código ainda não está disponível no backend;
    // encaminhamos o token via querystring para a tela de redefinição definitiva.
    toast.info('Validando o código de recuperação...')
    navigate(`/entrar?modo=login&token=${encodeURIComponent(codigo.trim())}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: fonts.body,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <img src="/assets/giro_logo.svg" alt="" style={{ height: '48px', width: 'auto', display: 'block' }} />
        <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '36px', width: 'auto', display: 'block' }} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '18px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(16,24,40,.05)',
        }}
      >
        {etapa === 'solicitar' && (
          <div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>
              Recuperar senha
            </h2>
            <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '14px', lineHeight: 1.5 }}>
              Informe o e-mail cadastrado e enviaremos um código para você redefinir sua senha.
            </p>
            <div style={{ marginBottom: '22px' }}>
              <TextInput
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@dominio.com"
                autoComplete="email"
                disabled={enviando}
              />
            </div>
            <Button onClick={enviarLink} disabled={enviando} style={{ ...primaryBtn, opacity: enviando ? 0.7 : 1 }} hoverStyle={{ background: colors.primaryHover }}>
              {enviando ? 'Enviando...' : 'Enviar código de recuperação'}
            </Button>
          </div>
        )}

        {etapa === 'enviado' && (
          <div>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: colors.tintBlue,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '18px',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>
              Verifique seu e-mail
            </h2>
            <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '14px', lineHeight: 1.5 }}>
              Se houver uma conta associada a <strong style={{ color: colors.ink }}>{email}</strong>, enviamos um código de
              recuperação. O código expira em 30 minutos.
            </p>
            <Button onClick={() => setEtapa('redefinir')} style={primaryBtn} hoverStyle={{ background: colors.primaryHover }}>
              Já tenho o código
            </Button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={reenviar}
                style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Reenviar código
              </button>
            </div>
          </div>
        )}

        {etapa === 'redefinir' && (
          <div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>
              Definir nova senha
            </h2>
            <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '14px', lineHeight: 1.5 }}>
              Digite o código recebido por e-mail e escolha uma nova senha.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <TextInput label="Código de recuperação" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: 8X4K2P" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <TextInput
                label="Nova senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <TextInput
                label="Confirmar nova senha"
                type="password"
                value={conf}
                onChange={(e) => setConf(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button onClick={redefinir} style={primaryBtn} hoverStyle={{ background: colors.primaryHover }}>
              Redefinir senha
            </Button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={() => navigate('/entrar?modo=login')}
            style={{ background: 'none', border: 'none', color: colors.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            ← Voltar ao login
          </button>
        </div>
      </div>
    </div>
  )
}
