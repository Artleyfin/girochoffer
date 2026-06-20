import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Cabeçalho da área autenticada, com navegação dependente do papel. */
export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role, setRole, usuarios } = useApp();
  const isEmpresa = role === 'empresa';

  const navDefs = isEmpresa
    ? [
        ['Painel', '/empresa'],
        ['Nova carga', '/empresa/nova'],
        ['Meu perfil', '/perfil'],
      ]
    : [
        ['Cargas disponíveis', '/motorista'],
        ['Minhas cargas', '/motorista/minhas'],
        ['Meu perfil', '/perfil'],
      ];

  /* Marca o item ativo levando em conta as telas de detalhe. */
  const isActive = (path) => {
    if (path === '/empresa') return pathname === '/empresa' || pathname.startsWith('/empresa/carga');
    if (path === '/motorista') return pathname === '/motorista' || pathname.startsWith('/motorista/carga');
    return pathname === path;
  };

  const baseNav = {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: colors.muted3,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  };
  const actNav = { ...baseNav, background: colors.tintBlue, color: colors.tintBlueText };

  const logout = () => {
    setRole(null);
    navigate('/');
  };

  const u = isEmpresa ? usuarios.empresa : usuarios.motorista;
  const userName = isEmpresa ? u.nome : u.nomeCurto;
  const userInitials = u.iniciais;
  const userRoleLabel = isEmpresa ? 'Empresa · Transportadora' : 'Motorista autônomo';

  return (
    <header
      style={{
        height: '64px',
        background: '#fff',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }}
        onClick={() => navigate(isEmpresa ? '/empresa' : '/motorista')}
      >
        <img src="/assets/giro_logo.svg" alt="" style={{ height: '42px', width: 'auto', display: 'block' }} />
        <img src="/assets/giro_nome.svg" alt="GiroChoffer" style={{ height: '32px', width: 'auto', display: 'block' }} />
      </div>
      <nav style={{ display: 'flex', gap: '4px' }}>
        {navDefs.map(([label, path]) => (
          <button key={path} onClick={() => navigate(path)} style={isActive(path) ? actNav : baseNav}>
            {label}
          </button>
        ))}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.ink }}>{userName}</div>
          <div style={{ fontSize: '11px', color: colors.muted }}>{userRoleLabel}</div>
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: colors.navy,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            fontFamily: fonts.heading,
          }}
        >
          {userInitials}
        </div>
        <button
          onClick={logout}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            color: colors.muted,
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
