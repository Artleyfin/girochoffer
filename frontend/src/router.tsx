import { createBrowserRouter } from 'react-router-dom'

import RootGate from './components/routing/RootGate'
import RouteError from './components/routing/RouteError'
import ProtectedRoute from './components/routing/ProtectedRoute'
import EmpresaRoute from './components/routing/EmpresaRoute'
import MotoristaRoute from './components/routing/MotoristaRoute'
import AppLayout from './components/giro/AppLayout'

// Páginas públicas
import LandingPage from './pages/giro/LandingPage'
import AuthPage from './pages/giro/AuthPage'
import RecuperarSenhaPage from './pages/giro/RecuperarSenhaPage'

// Empresa
import EmpresaPainelPage from './pages/giro/EmpresaPainelPage'
import EmpresaNovaCargaPage from './pages/giro/EmpresaNovaCargaPage'
import EmpresaDetalhesPage from './pages/giro/EmpresaDetalhesPage'

// Motorista
import MotoristaPainelPage from './pages/giro/MotoristaPainelPage'
import MotoristaDetalhesPage from './pages/giro/MotoristaDetalhesPage'
import MotoristaMinhasPage from './pages/giro/MotoristaMinhasPage'

// Perfil (qualquer autenticado)
import PerfilPage from './pages/giro/PerfilPage'

import { colors, fonts } from '@/lib/theme'
import { Link } from 'react-router-dom'

// 404 mínima, no estilo GiroChoffer.
function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: colors.bg,
        color: colors.text,
        fontFamily: fonts.body,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: fonts.heading, fontSize: 64, margin: 0, color: colors.navy }}>404</h1>
      <p style={{ color: colors.muted, margin: 0 }}>Página não encontrada.</p>
      <Link
        to="/"
        style={{
          marginTop: 8,
          color: colors.primary,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Voltar para o início
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootGate />,
    errorElement: <RouteError />,
    children: [
      // ===== Público =====
      { index: true, element: <LandingPage /> },
      { path: '/entrar', element: <AuthPage /> },
      { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },

      // ===== Empresa =====
      {
        element: <EmpresaRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/empresa', element: <EmpresaPainelPage /> },
              { path: '/empresa/nova', element: <EmpresaNovaCargaPage /> },
              { path: '/empresa/carga/:id', element: <EmpresaDetalhesPage /> },
            ],
          },
        ],
      },

      // ===== Motorista =====
      {
        element: <MotoristaRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/motorista', element: <MotoristaPainelPage /> },
              { path: '/motorista/carga/:id', element: <MotoristaDetalhesPage /> },
              { path: '/motorista/minhas', element: <MotoristaMinhasPage /> },
            ],
          },
        ],
      },

      // ===== Autenticado (qualquer perfil) =====
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [{ path: '/perfil', element: <PerfilPage /> }],
          },
        ],
      },

      // ===== 404 =====
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
