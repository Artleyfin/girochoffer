import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado E perfil Empresa.
// Sem usuário -> /entrar; perfil errado -> painel do próprio perfil (ou /entrar).
export default function EmpresaRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  const isEmpresa = useAuthStore((s) => s.isEmpresa())
  const isMotorista = useAuthStore((s) => s.isMotorista())
  const isAdmin = useAuthStore((s) => s.isAdmin())

  if (!usuario) return <Navigate to="/entrar" replace />
  if (!isEmpresa) {
    if (isMotorista) return <Navigate to="/motorista" replace />
    if (isAdmin) return <Navigate to="/admin/usuarios" replace />
    return <Navigate to="/entrar" replace />
  }
  return <Outlet />
}
