import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado. Redireciona para /login preservando o destino.
export default function ProtectedRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
