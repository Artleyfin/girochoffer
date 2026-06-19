import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado E perfil Motorista.
// Sem usuário -> /entrar; perfil errado -> painel do próprio perfil (ou /entrar).
export default function MotoristaRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  const isMotorista = useAuthStore((s) => s.isMotorista())
  const isEmpresa = useAuthStore((s) => s.isEmpresa())
  const isAdmin = useAuthStore((s) => s.isAdmin())

  if (!usuario) return <Navigate to="/entrar" replace />
  if (!isMotorista) {
    if (isEmpresa) return <Navigate to="/empresa" replace />
    if (isAdmin) return <Navigate to="/admin/usuarios" replace />
    return <Navigate to="/entrar" replace />
  }
  return <Outlet />
}
