import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { api, ApiError } from '@/lib/api'
import { Perfil } from '@/lib/types'
import type { PaginaResponse, Usuario } from '@/lib/types'
import { adminCriarUsuarioSchema, adminEditarUsuarioSchema } from '@/lib/schemas'
import { useFetch } from '@/hooks/useFetch'
import { useUIStore, toast } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { TextInput, SelectInput } from '@/components/giro/FormControls'
import { formatarData } from '@/lib/format'
import { colors, fonts } from '@/lib/theme'

/* Gestão de usuários (admin): listar (filtro perfil + busca) + criar (somente
   Administrador) + editar (nome/e-mail; perfil read-only) + excluir.
   Consome /api/admin/usuarios. Criar/editar em modal. */

const POR_PAGINA = 10
const CORES_PERFIL: Record<string, string> = {
  Administrador: colors.navy,
  Empresa: colors.primary,
  Motorista: '#1E8E5A',
}

type Erros = Record<string, string>

function PerfilPill({ perfil }: { perfil: string }) {
  const cor = CORES_PERFIL[perfil] ?? colors.muted
  return (
    <span style={{ background: cor + '1A', color: cor, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
      {perfil}
    </span>
  )
}

export default function AdminUsuariosPage() {
  const usuarioLogado = useAuthStore((s) => s.usuario)
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)

  const [pagina, setPagina] = useState(1)
  const [perfilFiltro, setPerfilFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')

  const { data, carregando, erro, recarregar } = useFetch<PaginaResponse<Usuario>>(
    (signal) =>
      api.get<PaginaResponse<Usuario>>('/admin/usuarios', {
        params: {
          pagina,
          por_pagina: POR_PAGINA,
          perfil: perfilFiltro || undefined,
          q: buscaAplicada || undefined,
        },
        signal,
      }),
    [pagina, perfilFiltro, buscaAplicada],
  )

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  function abrirCriar() {
    setEditando(null)
    setForm({ nome: '', email: '', senha: '', confirmarSenha: '' })
    setErros({})
    setModalAberto(true)
  }
  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({ nome: u.nome, email: u.email, senha: '', confirmarSenha: '' })
    setErros({})
    setModalAberto(true)
  }
  function fechar() {
    setModalAberto(false)
  }

  function aplicarBusca(e: FormEvent) {
    e.preventDefault()
    setPagina(1)
    setBuscaAplicada(busca.trim())
  }

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErros({})

    if (editando) {
      const parsed = adminEditarUsuarioSchema.safeParse({ nome: form.nome, email: form.email })
      if (!parsed.success) return setErros(mapZod(parsed.error.flatten().fieldErrors))
      setSalvando(true)
      try {
        await api.put(`/admin/usuarios/${editando.id}`, {
          id: editando.id,
          nome: parsed.data.nome,
          email: parsed.data.email,
          perfil: editando.perfil, // perfil é read-only no admin
        })
        toast.sucesso('Usuário atualizado.')
        fechar()
        recarregar()
      } catch (err) {
        tratarErro(err)
      } finally {
        setSalvando(false)
      }
    } else {
      const parsed = adminCriarUsuarioSchema.safeParse(form)
      if (!parsed.success) return setErros(mapZod(parsed.error.flatten().fieldErrors))
      setSalvando(true)
      try {
        await api.post('/admin/usuarios', {
          nome: parsed.data.nome,
          email: parsed.data.email,
          senha: parsed.data.senha,
          perfil: Perfil.ADMIN, // criação restrita a Administrador
        })
        toast.sucesso('Administrador criado.')
        fechar()
        setPagina(1)
        recarregar()
      } catch (err) {
        tratarErro(err)
      } finally {
        setSalvando(false)
      }
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

  function excluir(u: Usuario) {
    const ehDominio = u.perfil === Perfil.EMPRESA || u.perfil === Perfil.MOTORISTA
    pedirConfirmacao({
      titulo: 'Excluir usuário',
      mensagem: `Excluir "${u.nome}" (${u.email})?`,
      detalhes: ehDominio
        ? 'Atenção: como é um usuário de domínio, os dados vinculados (perfil, veículos e cargas) também serão removidos em cascata.'
        : 'Esta ação é permanente.',
      tipo: 'danger',
      textoConfirmar: 'Excluir',
      onConfirmar: async () => {
        try {
          await api.delete(`/admin/usuarios/${u.id}`)
          toast.sucesso('Usuário excluído.')
          recarregar()
        } catch (err) {
          tratarErro(err)
        }
      },
    })
  }

  return (
    <div style={{ padding: '32px 36px 56px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 28, color: colors.inkStrong, margin: '0 0 4px' }}>
            Usuários
          </h1>
          <p style={{ color: colors.muted, margin: 0 }}>Gerencie as contas da plataforma.</p>
        </div>
        <button onClick={abrirCriar} style={btnPrimario}>
          + Novo administrador
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={aplicarBusca} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            style={{ ...inputBase, flex: 1 }}
          />
          <button type="submit" style={btnSecundario}>Buscar</button>
        </form>
        <select
          value={perfilFiltro}
          onChange={(e) => {
            setPagina(1)
            setPerfilFiltro(e.target.value)
          }}
          style={{ ...inputBase, minWidth: 180 }}
        >
          <option value="">Todos os perfis</option>
          <option value={Perfil.ADMIN}>Administrador</option>
          <option value={Perfil.EMPRESA}>Empresa</option>
          <option value={Perfil.MOTORISTA}>Motorista</option>
        </select>
      </div>

      {carregando && <Spinner texto="Carregando usuários..." />}
      {erro && <p style={{ color: '#C0392B' }}>Erro ao carregar usuários.</p>}

      {data && data.items.length === 0 && (
        <EmptyState titulo="Nenhum usuário" mensagem="Nenhum usuário corresponde aos filtros." />
      )}

      {data && data.items.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F7F9FC', color: colors.muted, textAlign: 'left' }}>
                <th style={th}>Nome</th>
                <th style={th}>E-mail</th>
                <th style={thCentro}>Perfil</th>
                <th style={thCentro}>Cadastro</th>
                <th style={thCentro}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ ...td, fontWeight: 600, color: colors.ink }}>{u.nome}</td>
                  <td style={{ ...td, color: colors.muted }}>{u.email}</td>
                  <td style={{ ...td, textAlign: 'center' }}><PerfilPill perfil={u.perfil} /></td>
                  <td style={{ ...td, textAlign: 'center', color: colors.muted }}>{formatarData(u.data_cadastro)}</td>
                  <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={() => abrirEditar(u)} title="Editar usuário" aria-label="Editar usuário" style={btnIcone}>
                      <IconeEditar />
                    </button>
                    {u.id !== usuarioLogado?.id && (
                      <button
                        onClick={() => excluir(u)}
                        title="Excluir usuário"
                        aria-label="Excluir usuário"
                        style={{ ...btnIcone, color: '#C0392B' }}
                      >
                        <IconeExcluir />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div style={{ marginTop: 18 }}>
          <Pagination pagina={data.pagina} totalPaginas={data.total_paginas} onPagina={setPagina} />
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <div style={overlay} onClick={fechar}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 20, color: colors.inkStrong, margin: '0 0 4px' }}>
              {editando ? 'Editar usuário' : 'Novo administrador'}
            </h2>
            <p style={{ color: colors.muted, fontSize: 13, margin: '0 0 20px' }}>
              {editando
                ? 'Atualize nome e e-mail. O perfil não é alterável aqui.'
                : 'Cria uma conta de Administrador. Empresas e motoristas entram pelo auto-cadastro.'}
            </p>

            <form onSubmit={submeter}>
              <div style={{ marginBottom: 14 }}>
                <TextInput
                  label="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
                {erros.nome && <Erro msg={erros.nome} />}
              </div>
              <div style={{ marginBottom: 14 }}>
                <TextInput
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {erros.email && <Erro msg={erros.email} />}
              </div>

              {editando ? (
                <div style={{ marginBottom: 14 }}>
                  <SelectInput label="Perfil" value={editando.perfil} disabled>
                    <option>{editando.perfil}</option>
                  </SelectInput>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <TextInput
                      label="Senha"
                      type="password"
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    />
                    {erros.senha && <Erro msg={erros.senha} />}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <TextInput
                      label="Confirmar senha"
                      type="password"
                      value={form.confirmarSenha}
                      onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                    />
                    {erros.confirmarSenha && <Erro msg={erros.confirmarSenha} />}
                  </div>
                </>
              )}

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

function Erro({ msg }: { msg: string }) {
  return <div style={{ color: '#C0392B', fontSize: 12, marginTop: 5 }}>{msg}</div>
}

/* Ícones (linha do Feather) para as ações da tabela. */
function IconeEditar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
function IconeExcluir() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
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
const td: CSSProperties = { padding: '13px 16px' }
const inputBase: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 9,
  border: `1px solid ${colors.borderInput}`,
  fontSize: 14,
  fontFamily: fonts.body,
  color: colors.ink,
  background: '#fff',
}
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
const thCentro: CSSProperties = { ...th, textAlign: 'center' }
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
