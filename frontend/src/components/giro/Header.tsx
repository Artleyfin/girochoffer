import { useNavigate, useLocation } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useAuthStore } from '@/store/authStore'
import { colors, fonts } from '@/lib/theme'

/* Cabeçalho sticky da área autenticada, com navegação dependente do perfil.
   Portado de design/girochoffer-react/src/components/Header.jsx, ligado ao
   authStore (perfil/logout) e ao react-router-dom. */

/* Extrai até duas iniciais do nome para o avatar. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const usuario = useAuthStore((s) => s.usuario)
  const isEmpresa = useAuthStore((s) => s.isEmpresa())
  const logout = useAuthStore((s) => s.logout)

  const home = isEmpresa ? '/empresa' : '/motorista'

  const navDefs: [string, string][] = isEmpresa
    ? [
        ['Painel', '/empresa'],
        ['Nova carga', '/empresa/nova'],
        ['Meu perfil', '/perfil'],
      ]
    : [
        ['Cargas disponíveis', '/motorista'],
        ['Minhas cargas', '/motorista/minhas'],
        ['Meu perfil', '/perfil'],
      ]

  /* Marca o item ativo levando em conta as telas de detalhe. */
  const isActive = (path: string): boolean => {
    if (path === '/empresa') return pathname === '/empresa' || pathname.startsWith('/empresa/carga')
    if (path === '/motorista')
      return pathname === '/motorista' || pathname.startsWith('/motorista/carga')
    return pathname === path
  }

  const baseNav: CSSProperties = {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: colors.muted3,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  }
  const actNav: CSSProperties = { ...baseNav, background: colors.tintBlue, color: colors.tintBlueText }

  const fazerLogout = async () => {
    await logout()
    navigate('/')
  }

  const userName = usuario?.nome ?? ''
  const userInitials = iniciais(userName)
  const userRoleLabel = isEmpresa ? 'Empresa · Transportadora' : 'Motorista autônomo'

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
        onClick={() => navigate(home)}
      >
        <img src="/assets/giro_logo.svg" alt="" style={{ height: '42px', width: 'auto', display: 'block' }} />
        <img
          src="/assets/giro_nome.svg"
          alt="GiroChoffer"
          style={{ height: '32px', width: 'auto', display: 'block' }}
        />
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
          onClick={fazerLogout}
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
  )
}
