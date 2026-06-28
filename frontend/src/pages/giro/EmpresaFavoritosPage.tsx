import { useCallback, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { MotoristaResumo } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { useFetch } from '@/hooks/useFetch'
import { toast, useUIStore } from '@/store/uiStore'
import MotoristaInteressadoCard from '@/components/giro/MotoristaInteressadoCard'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'

/* Página de motoristas favoritos da EMPRESA (rota /empresa/favoritos).
   Lista os favoritos e permite desfavoritar. */

export default function EmpresaFavoritosPage() {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [agindo, setAgindo] = useState(false)

  const carregar = useCallback(
    (signal: AbortSignal) => api.get<MotoristaResumo[]>('/empresa/favoritos', { signal }),
    [],
  )
  const { data: favoritos, carregando, erro, recarregar } = useFetch<MotoristaResumo[]>(carregar, [])

  function desfavoritar(motoristaId: number, nome: string) {
    pedirConfirmacao({
      titulo: 'Remover favorito',
      mensagem: `Remover ${nome} dos seus favoritos?`,
      textoConfirmar: 'Remover',
      tipo: 'danger',
      onConfirmar: async () => {
        setAgindo(true)
        try {
          await api.delete(`/empresa/favoritos/${motoristaId}`)
          toast.sucesso('Motorista removido dos favoritos.')
          recarregar()
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Não foi possível remover o favorito.')
        } finally {
          setAgindo(false)
        }
      },
    })
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '30px',
          color: colors.inkStrong,
          margin: '0 0 4px',
        }}
      >
        Motoristas favoritos
      </h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Os motoristas que você marcou como favoritos.
      </p>

      {carregando ? (
        <Spinner texto="Carregando favoritos..." />
      ) : erro ? (
        <EmptyState>Não foi possível carregar seus favoritos. Tente novamente.</EmptyState>
      ) : !favoritos || favoritos.length === 0 ? (
        <EmptyState padding="48px">Você ainda não favoritou nenhum motorista.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favoritos.map((m) => (
            <MotoristaInteressadoCard
              key={m.id}
              motorista={m}
              favorito
              onToggleFavorito={agindo ? undefined : () => desfavoritar(m.id, m.nome)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
