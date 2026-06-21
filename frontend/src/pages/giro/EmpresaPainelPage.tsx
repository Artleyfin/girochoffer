import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { CargaResumo, PaginaResponse } from '@/lib/types'
import { StatusCarga } from '@/lib/types'
import { useFetch } from '@/hooks/useFetch'
import { useAuthStore } from '@/store/authStore'
import { colors, fonts } from '@/lib/theme'
import Button from '@/components/giro/Button'
import CargaCardEmpresa from '@/components/giro/CargaCardEmpresa'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'

/* Rótulo derivado de exibição: uma carga Disponível com interessados
   aparece como "Com interessados" (não é status armazenado). */
const ROTULO_COM_INTERESSADOS = 'Com interessados'

/* Abas de filtro. A chave 'todas' não filtra; as demais batem com o
   rótulo de exibição (status_rotulo) de cada carga. */
const tabDefs: ReadonlyArray<readonly [string, string]> = [
  ['todas', 'Todas'],
  [StatusCarga.DISPONIVEL, 'Disponíveis'],
  [ROTULO_COM_INTERESSADOS, 'Com interessados'],
  [StatusCarga.CONTRATADA, 'Contratadas'],
  [StatusCarga.CONCLUIDA, 'Concluídas'],
]

/* Tamanho de página grande: o painel carrega todas as cargas da empresa
   de uma vez para calcular as estatísticas e filtrar por aba no cliente
   (o rótulo "Com interessados" é derivado e não filtrável no servidor). */
const POR_PAGINA = 100
const POR_PAGINA_TELA = 8

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '32px', color }}>{value}</div>
      <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>{label}</div>
    </div>
  )
}

export default function EmpresaPainelPage() {
  const navigate = useNavigate()
  const nome = useAuthStore((s) => s.usuario?.nome ?? '')
  const [tab, setTab] = useState<string>('todas')
  const [pagina, setPagina] = useState(1)

  const { data, carregando, erro } = useFetch<PaginaResponse<CargaResumo>>(
    (signal) => api.get('/empresa/cargas', { params: { pagina: 1, por_pagina: POR_PAGINA }, signal }),
    [],
  )

  const cargas = useMemo(() => data?.items ?? [], [data])

  const stats = useMemo(() => {
    let disp = 0
    let inter = 0
    let contr = 0
    let concl = 0
    for (const c of cargas) {
      if (c.status === StatusCarga.DISPONIVEL) {
        if (c.total_interesses > 0) inter++
        else disp++
      } else if (c.status === StatusCarga.CONTRATADA) contr++
      else if (c.status === StatusCarga.CONCLUIDA) concl++
    }
    return { disp, inter, contr, concl }
  }, [cargas])

  const filtradas = useMemo(() => {
    if (tab === 'todas') return cargas
    return cargas.filter((c) => c.status_rotulo === tab)
  }, [cargas, tab])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA_TELA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA_TELA, paginaAtual * POR_PAGINA_TELA)

  function trocarTab(key: string) {
    setTab(key)
    setPagina(1)
  }

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '28px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontWeight: 800,
              fontSize: '30px',
              color: colors.inkStrong,
              margin: '0 0 4px',
            }}
          >
            Painel da empresa
          </h1>
          <p style={{ margin: 0, color: colors.muted, fontSize: '15px' }}>
            {nome ? `Olá, ${nome}. ` : ''}Acompanhe suas cargas publicadas e os motoristas interessados.
          </p>
        </div>
        <Button
          onClick={() => navigate('/empresa/nova')}
          style={{
            padding: '13px 24px',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '11px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
          }}
          hoverStyle={{ background: colors.primaryHover }}
        >
          + Publicar nova carga
        </Button>
      </div>

      {carregando ? (
        <Spinner texto="Carregando suas cargas..." />
      ) : erro ? (
        <EmptyState>Não foi possível carregar suas cargas. Tente novamente mais tarde.</EmptyState>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
            <StatCard value={stats.disp} label="Disponíveis" color={colors.primary} />
            <StatCard value={stats.inter} label="Com interessados" color="#B7791F" />
            <StatCard value={stats.contr} label="Contratadas" color="#1E8E5A" />
            <StatCard value={stats.concl} label="Concluídas" color={colors.muted3} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {tabDefs.map(([key, label]) => {
              const on = tab === key
              return (
                <button
                  key={key}
                  onClick={() => trocarTab(key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: `1px solid ${on ? colors.primary : colors.border}`,
                    background: on ? colors.primary : '#fff',
                    color: on ? '#fff' : colors.muted3,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {visiveis.map((c) => (
              <CargaCardEmpresa key={c.id} carga={c} />
            ))}
          </div>

          {filtradas.length === 0 && <EmptyState>Nenhuma carga neste status.</EmptyState>}

          {totalPaginas > 1 && (
            <div style={{ marginTop: '24px' }}>
              <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onPagina={setPagina} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
