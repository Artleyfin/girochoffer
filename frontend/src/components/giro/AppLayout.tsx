import { Outlet } from 'react-router-dom'
import Header from './Header'
import { colors, fonts } from '@/lib/theme'

/* Casca da área autenticada: header sticky + conteúdo da rota.
   Portado de design/girochoffer-react/src/components/AppLayout.jsx. */
export default function AppLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: fonts.body,
        color: colors.text,
      }}
    >
      <Header />
      <Outlet />
    </div>
  )
}
