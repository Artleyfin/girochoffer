import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { api, ApiError } from '@/lib/api'
import type { CatalogoAdmin, CatalogoItemAdmin } from '@/lib/types'
import { catalogoItemSchema } from '@/lib/schemas'
import { useFetch } from '@/hooks/useFetch'
import { toast } from '@/store/uiStore'
import Spinner from '@/components/ui/Spinner'
import { TextInput } from '@/components/giro/FormControls'
import { colors, fonts } from '@/lib/theme'

/* Gestão do catálogo logístico (admin): listar tipos de veículo e carrocerias
   (ativos e inativos), criar, renomear e ativar/desativar.
   Consome /api/admin/catalogos. Criar/renomear em modal. */

// O segmento da URL que o backend espera para cada catálogo.
type TipoCatalogo = 'tipo_veiculo' | 'tipo_carroceria'

type Erros = Record<string, string>

export default function AdminCatalogoPage() {
  const { data, carregando, erro, recarregar } = useFetch<CatalogoAdmin>(
    (signal) => api.get<CatalogoAdmin>('/admin/catalogos', { signal }),
    [],
  )

  // Modal de criar/renomear
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoAtual, setTipoAtual] = useState<TipoCatalogo>('tipo_veiculo')
  const [editando, setEditando] = useState<CatalogoItemAdmin | null>(null)
  const [nome, setNome] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  function abrirCriar(tipo: TipoCatalogo) {
    setTipoAtual(tipo)
    setEditando(null)
    setNome('')
    setErros({})
    setModalAberto(true)
  }
  function abrirEditar(tipo: TipoCatalogo, item: CatalogoItemAdmin) {
    setTipoAtual(tipo)
    setEditando(item)
    setNome(item.nome)
    setErros({})
    setModalAberto(true)
  }
  function fechar() {
    setModalAberto(false)
  }

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErros({})

    const parsed = catalogoItemSchema.safeParse({ nome })
    if (!parsed.success) {
      return setErros(mapZod(parsed.error.flatten().fieldErrors))
    }

    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/admin/catalogos/${tipoAtual}/${editando.id}`, {
          nome: parsed.data.nome,
        })
        toast.sucesso('Item renomeado.')
      } else {
        await api.post(`/admin/catalogos/${tipoAtual}`, {
          nome: parsed.data.nome,
        })
        toast.sucesso('Item criado.')
      }
      fechar()
      recarregar()
    } catch (err) {
      tratarErro(err)
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(tipo: TipoCatalogo, item: CatalogoItemAdmin) {
    try {
      await api.patch(`/admin/catalogos/${tipo}/${item.id}/ativo`, {
        ativo: !item.ativo,
      })
      toast.sucesso(item.ativo ? 'Item desativado.' : 'Item ativado.')
      recarregar()
    } catch (err) {
      tratarErro(err)
    }
  }

  function tratarErro(err: unknown) {
    if (err instanceof ApiError) {
      if (err.errors) setErros(mapApi(err.errors))
      toast.erro(err.message)
    } else {
      toast.erro((err as Error).message)
    }
  }

  return (
    <div style={{ padding: '32px 36px 56px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 28, color: colors.inkStrong, margin: '0 0 4px' }}>
          Catálogos
        </h1>
        <p style={{ color: colors.muted, margin: 0 }}>
          Gerencie os tipos de veículo e carrocerias disponíveis na plataforma.
        </p>
      </div>

      {carregando && <Spinner texto="Carregando catálogos..." />}
      {erro && <p style={{ color: '#C0392B' }}>Erro ao carregar catálogos.</p>}

      {data && (
        <>
          <Secao
            titulo="Tipos de veículo"
            tipo="tipo_veiculo"
            itens={data.tipos_veiculo}
            onCriar={abrirCriar}
            onEditar={abrirEditar}
            onAlternar={alternarAtivo}
          />
          <Secao
            titulo="Carrocerias"
            tipo="tipo_carroceria"
            itens={data.carrocerias}
            onCriar={abrirCriar}
            onEditar={abrirEditar}
            onAlternar={alternarAtivo}
          />
        </>
      )}

      {/* Modal criar/renomear */}
      {modalAberto && (
        <div style={overlay} onClick={fechar}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 20, color: colors.inkStrong, margin: '0 0 4px' }}>
              {editando ? 'Renomear item' : 'Novo item'}
            </h2>
            <p style={{ color: colors.muted, fontSize: 13, margin: '0 0 20px' }}>
              {tipoAtual === 'tipo_veiculo' ? 'Tipo de veículo' : 'Carroceria'}
            </p>

            <form onSubmit={submeter}>
              <div style={{ marginBottom: 14 }}>
                <TextInput
                  label="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                {erros.nome && <Erro msg={erros.nome} />}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button type="button" onClick={fechar} style={btnSecundario}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ ...btnPrimario, opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* Uma seção = uma tabela (tipos de veículo OU carrocerias). */
function Secao({
  titulo,
  tipo,
  itens,
  onCriar,
  onEditar,
  onAlternar,
}: {
  titulo: string
  tipo: TipoCatalogo
  itens: CatalogoItemAdmin[]
  onCriar: (tipo: TipoCatalogo) => void
  onEditar: (tipo: TipoCatalogo, item: CatalogoItemAdmin) => void
  onAlternar: (tipo: TipoCatalogo, item: CatalogoItemAdmin) => void
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 18, color: colors.ink, margin: 0 }}>
          {titulo}
        </h2>
        <button onClick={() => onCriar(tipo)} style={btnPrimario}>+ Novo tipo</button>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F7F9FC', color: colors.muted, textAlign: 'left' }}>
              <th style={th}>Nome</th>
              <th style={thCentro}>Ativo</th>
              <th style={thCentro}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ ...td, fontWeight: 600, color: colors.ink }}>{item.nome}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <button
                    onClick={() => onAlternar(tipo, item)}
                    title={item.ativo ? 'Desativar' : 'Ativar'}
                    aria-label={item.ativo ? 'Desativar' : 'Ativar'}
                    style={{
                      ...togglePill,
                      background: item.ativo ? '#1E8E5A' : colors.muted,
                    }}
                  >
                    <span
                      style={{
                        ...toggleKnob,
                        transform: item.ativo ? 'translateX(18px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </td>
                <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <button onClick={() => onEditar(tipo, item)} title="Renomear" aria-label="Renomear" style={btnIcone}>
                    <IconeEditar />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Erro({ msg }: { msg: string }) {
  return <div style={{ color: '#C0392B', fontSize: 12, marginTop: 5 }}>{msg}</div>
}

function IconeEditar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}

function mapZod(fe: Record<string, string[] | undefined>): Erros {
  const m: Erros = {}
  for (const [k, v] of Object.entries(fe)) if (v && v.length) m[k] = v[0]
  return m
}
function mapApi(errs: Record<string, string[]>): Erros {
  const m: Erros = {}
  for (const [k, v] of Object.entries(errs)) if (v && v.length) m[k] = v[0]
  return m
}

const th: CSSProperties = { padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.3px' }
const thCentro: CSSProperties = { ...th, textAlign: 'center' }
const td: CSSProperties = { padding: '13px 16px' }
const btnPrimario: CSSProperties = {
  padding: '10px 18px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: 9,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}
const btnSecundario: CSSProperties = {
  padding: '10px 16px',
  background: '#fff',
  color: colors.ink,
  border: `1px solid ${colors.borderInput}`,
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}
const btnIcone: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: colors.primary,
  cursor: 'pointer',
  padding: 6,
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
  margin: '0 2px',
}
const togglePill: CSSProperties = {
  width: 42,
  height: 24,
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  padding: 3,
  display: 'inline-flex',
  alignItems: 'center',
}
const toggleKnob: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: '#fff',
  display: 'block',
  transition: 'transform .15s ease',
}
const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,27,43,.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 20,
}
const modalCard: CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 28,
  width: '100%',
  maxWidth: 460,
  boxShadow: '0 20px 60px rgba(11,27,43,.25)',
}
