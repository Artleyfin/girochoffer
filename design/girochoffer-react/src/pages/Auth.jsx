import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/Button.jsx';
import { colors, fonts } from '../utils/theme.js';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setRole } = useApp();

  const [mode, setMode] = useState(params.get('modo') === 'login' ? 'login' : 'cadastro');
  const [authRole, setAuthRole] = useState(params.get('papel') === 'empresa' ? 'empresa' : 'motorista');

  const isCadastro = mode === 'cadastro';

  const submit = () => {
    setRole(authRole);
    navigate(authRole === 'empresa' ? '/empresa' : '/motorista');
  };

  const segStyle = (on) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${on ? colors.primary : colors.borderInput}`,
    background: on ? colors.tintBlue : '#fff',
    color: on ? colors.tintBlueText : colors.muted3,
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
  });
  const tabSty = (on) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: on ? '#fff' : 'transparent',
    color: on ? colors.ink : colors.muted,
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: on ? '0 1px 2px rgba(16,24,40,.12)' : 'none',
  });
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${colors.borderInput}`,
    borderRadius: '10px',
    fontSize: '14px',
    background: '#fff',
  };
  const lblStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' };

  const docLabel = authRole === 'empresa' ? 'CNPJ' : 'CPF';
  const docPh = authRole === 'empresa' ? '00.000.000/0000-00' : '000.000.000-00';
  const nomeLabel = authRole === 'empresa' ? 'Razão social' : 'Nome completo';
  const nomePh = authRole === 'empresa' ? 'Sua empresa Ltda' : 'Seu nome completo';

  const RolePicker = (
    <>
      <label style={{ ...lblStyle, marginBottom: '8px' }}>{isCadastro ? 'Quero me cadastrar como' : 'Entrar como'}</label>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAuthRole('motorista')} style={segStyle(authRole === 'motorista')}>Motorista</button>
        <button onClick={() => setAuthRole('empresa')} style={segStyle(authRole === 'empresa')}>Empresa</button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: fonts.body, color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src="/assets/giro_logo.svg" alt="" style={{ height: '48px', width: 'auto', display: 'block' }} />
        <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '36px', width: 'auto', display: 'block' }} />
      </div>
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '18px', padding: '32px', boxShadow: '0 4px 24px rgba(16,24,40,.05)' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#F1F4F8', borderRadius: '12px', padding: '4px', marginBottom: '26px' }}>
          <button onClick={() => setMode('cadastro')} style={tabSty(isCadastro)}>Criar conta</button>
          <button onClick={() => setMode('login')} style={tabSty(!isCadastro)}>Entrar</button>
        </div>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '24px', color: colors.inkStrong, margin: '0 0 22px' }}>
          {isCadastro ? 'Criar sua conta' : 'Entrar na sua conta'}
        </h2>

        {isCadastro ? (
          <div>
            {RolePicker}
            <div style={{ marginBottom: '14px' }}>
              <label style={lblStyle}>{nomeLabel}</label>
              <input style={inputStyle} placeholder={nomePh} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lblStyle}>{docLabel}</label>
              <input style={inputStyle} placeholder={docPh} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lblStyle}>E-mail</label>
                <input type="email" style={inputStyle} placeholder="email@dominio.com" />
              </div>
              <div>
                <label style={lblStyle}>Telefone</label>
                <input style={inputStyle} placeholder="(11) 90000-0000" />
              </div>
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label style={lblStyle}>Senha</label>
              <input type="password" style={inputStyle} placeholder="••••••••" />
            </div>
            <Button onClick={submit} style={{ width: '100%', padding: '14px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '11px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
              Criar conta e entrar
            </Button>
          </div>
        ) : (
          <div>
            {RolePicker}
            <div style={{ marginBottom: '14px' }}>
              <label style={lblStyle}>E-mail</label>
              <input type="email" style={inputStyle} placeholder="email@dominio.com" />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={lblStyle}>Senha</label>
              <input type="password" style={inputStyle} placeholder="••••••••" />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <a onClick={() => navigate('/recuperar-senha')} style={{ fontSize: '13px', color: colors.primary, textDecoration: 'none', cursor: 'pointer' }}>Esqueci minha senha</a>
            </div>
            <Button onClick={submit} style={{ width: '100%', padding: '14px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '11px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
              Entrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
