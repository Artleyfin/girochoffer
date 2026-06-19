import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { CargaResumo, Catalogo, PaginaResponse } from '@/lib/types'
import { colors, fonts, selectArrow } from '@/lib/theme'
import { useFetch } from '@/hooks/useFetch'
import { toast } from '@/store/uiStore'
import CargaCardMercado from '@/components/giro/CargaCardMercado'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  border: `1px solid ${colors.borderInput}`,
  borderRadius: '9px',
  fontSize: '14px',
  background: '#fff',
}
const lblStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: colors.muted,
  marginBottom: '6px',
}

/* Filtros aplicados (disparam a busca no servidor). */
interface Filtros {
  origem: string
  destino: string
  carroceriaId: string
}
const FILTROS_VAZIOS: Filtros = { origem: '', destino: '', carroceriaId: '' }

/* Vitrine de cargas disponíveis para o motorista.
   Portado de design/girochoffer-react/src/pages/MotoristaPainel.jsx, com
   filtros server-side (GET /motorista/cargas) e catálogo (GET /catalogos). */
export default function MotoristaPainelPage() {
  // Rascunho do formulário (o que está digitado) vs. filtros aplicados.
  const [rascunho, setRascunho] = useState<Filtros>(FILTROS_VAZIOS)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(1)

  const setCampo =
    (k: keyof Filtros) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setRascunho((f) => ({ ...f, [k]: e.target.value }))

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault()
    setPagina(1)
    setFiltros(rascunho)
  }
  const limpar = () => {
    setRascunho(FILTROS_VAZIOS)
    setFiltros(FILTROS_VAZIOS)
    setPagina(1)
  }

  // Catálogo de carrocerias (para o <select>). Carregado uma vez.
  const carregarCatalogo = useCallback(
    (signal: AbortSignal) => api.get<Catalogo>('/catalogos', { signal }),
    [],
  )
  const { data: catalogo } = useFetch<Catalogo>(carregarCatalogo, [])

  // Cargas disponíveis, filtradas no servidor e paginadas.
  const carregarCargas = useCallback(
    (signal: AbortSignal) =>
      api.get<PaginaResponse<CargaResumo>>('/motorista/cargas', {
        params: {
          origem: filtros.origem.trim() || undefined,
          destino: filtros.destino.trim() || undefined,
          carroceria_id: filtros.carroceriaId || undefined,
          pagina,
        },
        signal,
      }),
    [filtros, pagina],
  )
  const { data, carregando, erro } = useFetch<PaginaResponse<CargaResumo>>(carregarCargas, [
    filtros,
    pagina,
  ])

  useEffect(() => {
    if (erro) toast.erro(erro.message)
  }, [erro])

  const cargas = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '30px',
          color: colors.inkStrong,
          margin: '0 0 4px',
        }}
      >
        Cargas disponíveis
      </h1>
      <p style={{ margin: '0 0 24px', color: colors.muted, fontSize: '15px' }}>
        Encontre fretes compatíveis e demonstre seu interesse.
      </p>

      <form
        onSubmit={aplicar}
        style={{
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={lblStyle}>Origem</label>
          <input
            value={rascunho.origem}
            onChange={setCampo('origem')}
            placeholder="Cidade ou UF"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={lblStyle}>Destino</label>
          <input
            value={rascunho.destino}
            onChange={setCampo('destino')}
            placeholder="Cidade ou UF"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={lblStyle}>Carroceria</label>
          <select
            value={rascunho.carroceriaId}
            onChange={setCampo('carroceriaId')}
            style={{ ...inputStyle, ...selectArrow }}
          >
            <option value="">Todas as carrocerias</option>
            {catalogo?.carrocerias.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            height: '40px',
          }}
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={limpar}
          style={{
            padding: '10px 18px',
            background: '#F1F4F8',
            color: colors.muted,
            border: 'none',
            borderRadius: '9px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            height: '40px',
          }}
        >
          Limpar
        </button>
      </form>

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <div style={{ fontSize: '14px', color: colors.muted, marginBottom: '14px' }}>
            {total} carga(s) encontrada(s)
          </div>
          {cargas.length === 0 ? (
            <EmptyState>Nenhuma carga corresponde aos filtros.</EmptyState>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {cargas.map((c) => (
                  <CargaCardMercado key={c.id} carga={c} />
                ))}
              </div>
              {data && data.total_paginas > 1 && (
                <div style={{ marginTop: '28px' }}>
                  <Pagination
                    pagina={data.pagina}
                    totalPaginas={data.total_paginas}
                    onPagina={setPagina}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
