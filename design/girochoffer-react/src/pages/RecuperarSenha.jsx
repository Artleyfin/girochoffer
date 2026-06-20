import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/Button.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Fluxo de recuperação de senha em três etapas:
   solicitar (e-mail) → enviado (confirmação) → redefinir (código + nova senha). */
export default function RecuperarSenha() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [etapa, setEtapa] = useState('solicitar'); // 'solicitar' | 'enviado' | 'redefinir'
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [conf, setConf] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${colors.borderInput}`,
    borderRadius: '10px',
    fontSize: '14px',
    background: '#fff',
  };
  const lblStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' };
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
  };

  const enviarLink = () => {
    if (!email.trim()) {
      showToast('Informe o e-mail cadastrado.');
      return;
    }
    setEtapa('enviado');
  };

  const redefinir = () => {
    if (!codigo.trim() || !senha || !conf) {
      showToast('Preencha o código e a nova senha.');
      return;
    }
    if (senha !== conf) {
      showToast('As senhas não coincidem.');
      return;
    }
    showToast('Senha redefinida com sucesso. Faça login.');
    navigate('/entrar?modo=login');
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: fonts.body, color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src="/assets/giro_logo.svg" alt="" style={{ height: '48px', width: 'auto', display: 'block' }} />
        <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '36px', width: 'auto', display: 'block' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '18px', padding: '32px', boxShadow: '0 4px 24px rgba(16,24,40,.05)' }}>
        {etapa === 'solicitar' && (
          <div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>
              Recuperar senha
            </h2>
            <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '14px', lineHeight: 1.5 }}>
              Informe o e-mail cadastrado e enviaremos um código para você redefinir sua senha.
            </p>
            <div style={{ marginBottom: '22px' }}>
              <label style={lblStyle}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="email@dominio.com" />
            </div>
            <Button onClick={enviarLink} style={primaryBtn} hoverStyle={{ background: colors.primaryHover }}>
              Enviar código de recuperação
            </Button>
          </div>
        )}

        {etapa === 'enviado' && (
          <div>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: colors.tintBlue, color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '18px' }}>
              ✓
            </div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 8px' }}>
              Verifique seu e-mail
            </h2>
            <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '14px', lineHeight: 1.5 }}>
              Enviamos um código de recuperação para <strong style={{ color: colors.ink }}>{email}</strong>. O código expira em 30 minutos.
            </p>
            <Button onClick={() => setEtapa('redefinir')} style={primaryBtn} hoverStyle={{ background: colors.primaryHover }}>
              Já tenho o código
            </Button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => { showToast('Reenviamos o código de recuperação.'); }} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
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
              <label style={lblStyle}>Código de recuperação</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} style={inputStyle} placeholder="Ex.: 8X4K2P" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lblStyle}>Nova senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label style={lblStyle}>Confirmar nova senha</label>
              <input type="password" value={conf} onChange={(e) => setConf(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <Button onClick={redefinir} style={primaryBtn} hoverStyle={{ background: colors.primaryHover }}>
              Redefinir senha
            </Button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => navigate('/entrar?modo=login')} style={{ background: 'none', border: 'none', color: colors.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            ← Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
