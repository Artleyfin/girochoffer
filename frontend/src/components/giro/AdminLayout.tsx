import type { CSSProperties } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { colors, fonts } from '@/lib/theme'

/* Casca dedicada da área administrativa: sidebar lateral fixa + conteúdo.
   Distinta do Header de empresa/motorista (decisão: layout admin próprio). */

const NAV: { label: string; path: string; icon: string }[] = [
  { label: 'Dashboard', path: '/admin', icon: '◧' },
  { label: 'Usuários', path: '/admin/usuarios', icon: '☰' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)

  const fazerLogout = async () => {
    await logout()
    navigate('/')
  }

  const itemBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,.72)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: fonts.body,
  }
  const itemActive: CSSProperties = {
    ...itemBase,
    background: 'rgba(255,255,255,.12)',
    color: '#fff',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: colors.bg, fontFamily: fonts.body }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 248,
          flex: 'none',
          background: colors.navyDeep,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }}
          onClick={() => navigate('/admin')}
        >
          <img src="/assets/giro_logo_branco.svg" alt="" style={{ height: 36 }} />
          <span style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 19, color: '#fff', letterSpacing: '.3px' }}>
            GiroChoffer
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.6px',
            color: 'rgba(255,255,255,.4)',
            padding: '0 10px 10px',
          }}
        >
          Administração
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((n) => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              style={isActive(n.path) ? itemActive : itemBase}
            >
              <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 16 }}>
          <div style={{ padding: '0 10px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{usuario?.nome}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Administrador</div>
          </div>
          <button onClick={fazerLogout} style={{ ...itemBase, color: 'rgba(255,255,255,.85)' }}>
            <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>⏻</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, minWidth: 0, color: colors.text }}>
        <Outlet />
      </main>
    </div>
  )
}
