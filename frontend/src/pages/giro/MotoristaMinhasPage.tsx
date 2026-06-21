import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import type { CargaResumo, MinhasCargas } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { useFetch } from '@/hooks/useFetch'
import { toast } from '@/store/uiStore'
import CargaResumoRow from '@/components/giro/CargaResumoRow'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'

/* Cabeçalho de seção (título colorido + lista vertical de linhas).
   Portado de design/girochoffer-react/src/pages/MotoristaMinhas.jsx. */
function Secao({ titulo, cor, children }: { titulo: string; cor: string; children: ReactNode }) {
  return (
    <>
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: '15px',
          color: cor,
          marginBottom: '12px',
        }}
      >
        {titulo}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {children}
      </div>
    </>
  )
}

/* "Minhas cargas" do motorista: interesses enviados, fretes contratados e
   histórico de concluídas. Dados via GET /motorista/minhas (3 seções).
   Portado de design/girochoffer-react/src/pages/MotoristaMinhas.jsx, com
   dados reais (substitui o AppContext/mocks do protótipo). */
export default function MotoristaMinhasPage() {
  const carregar = useCallback(
    (signal: AbortSignal) => api.get<MinhasCargas>('/motorista/minhas', { signal }),
    [],
  )
  const { data, carregando, erro } = useFetch<MinhasCargas>(carregar, [])

  useEffect(() => {
    if (erro) toast.erro(erro.message)
  }, [erro])

  const enviados: CargaResumo[] = data?.interesse_enviado ?? []
  const contratadas: CargaResumo[] = data?.contratadas ?? []
  const concluidas: CargaResumo[] = data?.concluidas ?? []

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
        Minhas cargas
      </h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Acompanhe seus interesses, fretes contratados e o histórico.
      </p>

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <Secao titulo="Interesse enviado" cor="#B7791F">
            {enviados.length === 0 ? (
              <EmptyState padding="24px" radius="12px">
                Você ainda não demonstrou interesse em nenhuma carga.
              </EmptyState>
            ) : (
              enviados.map((c) => (
                <CargaResumoRow
                  key={c.id}
                  carga={c}
                  pill={{ label: 'Aguardando empresa', bg: '#FBF1E0', color: '#B7791F' }}
                  verButton
                />
              ))
            )}
          </Secao>

          <Secao titulo="Contratadas" cor="#1E8E5A">
            {contratadas.length === 0 ? (
              <EmptyState padding="24px" radius="12px">
                Nenhum frete contratado no momento.
              </EmptyState>
            ) : (
              contratadas.map((c) => (
                <CargaResumoRow
                  key={c.id}
                  carga={c}
                  borderColor="#CDE8D9"
                  pill={{ label: 'Contratada', bg: '#E3F4EC', color: '#1E8E5A' }}
                />
              ))
            )}
          </Secao>

          <Secao titulo="Concluídas" cor={colors.muted3}>
            {concluidas.length === 0 ? (
              <EmptyState padding="24px" radius="12px">
                Nenhum frete concluído ainda.
              </EmptyState>
            ) : (
              concluidas.map((c) => (
                <CargaResumoRow
                  key={c.id}
                  carga={c}
                  dimmed
                  pill={{ label: 'Concluída', bg: '#EDF0F4', color: colors.muted3 }}
                />
              ))
            )}
          </Secao>
        </>
      )}
    </div>
  )
}
