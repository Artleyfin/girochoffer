import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import Toasts from '../ui/Toasts'
import ConfirmModal from '../ui/ConfirmModal'
import AlertModal from '../ui/AlertModal'

// Componente raiz: verifica a sessão (GET /api/me) uma vez no boot e
// segura a renderização até saber se há usuário logado.
export default function RootGate() {
  const carregando = useAuthStore((s) => s.carregando)
  const carregarSessao = useAuthStore((s) => s.carregarSessao)

  useEffect(() => {
    carregarSessao()
  }, [carregarSessao])

  if (carregando) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <Outlet />
      <Toasts />
      <ConfirmModal />
      <AlertModal />
    </>
  )
}
