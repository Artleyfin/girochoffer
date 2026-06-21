import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { Perfil } from '@/lib/types'
import type { Usuario } from '@/lib/types'
import {
  cadastroEmpresaSchema,
  cadastroMotoristaSchema,
  loginSchema,
} from '@/lib/schemas'
import { useFetch } from '@/hooks/useFetch'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'
import { colors, fonts, selectArrow } from '@/lib/theme'
import { apenasDigitos, mascararCpf, mascararTelefone } from '@/lib/masks'
import Button from '@/components/giro/Button'
import Spinner from '@/components/ui/Spinner'
import type { Catalogo } from '@/lib/types'

/* AuthPage (rota /entrar): login + cadastro num só lugar, com escolha de perfil
   (Empresa/Motorista). Portado fielmente do design (Auth.jsx), usando a infra de
   produção: api central, schemas Zod, authStore, theme e feedback via toast. */

type Modo = 'login' | 'cadastro'
type Papel = 'empresa' | 'motorista'

/** Máscara de CNPJ: 00.000.000/0000-00 (limita a 14 dígitos). */
function mascararCnpj(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${colors.borderInput}`,
  borderRadius: '10px',
  fontSize: '14px',
  background: '#fff',
}
const lblStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: colors.text,
  marginBottom: '6px',
}
const erroStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: colors.text,
  marginTop: '4px',
  fontWeight: 600,
}
const erroColor = '#C0392B'

const submitBtnStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '11px',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
}

type Erros = Record<string, string | undefined>

export default function AuthPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useAuthStore((s) => s.login)

  const [modo, setModo] = useState<Modo>(
    params.get('modo') === 'login' ? 'login' : 'cadastro',
  )
  const [papel, setPapel] = useState<Papel>(
    params.get('papel') === 'empresa' ? 'empresa' : 'motorista',
  )
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Erros>({})

  // Campos comuns / login
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [telefone, setTelefone] = useState('')

  // Empresa
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')

  // Motorista
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [tipoVeiculoId, setTipoVeiculoId] = useState('')
  const [tipoCarroceriaId, setTipoCarroceriaId] = useState('')
  const [placa, setPlaca] = useState('')
  const [capacidadeKg, setCapacidadeKg] = useState('')

  // Catálogos (somente para o cadastro de motorista).
  const {
    data: catalogo,
    carregando: carregandoCatalogo,
    erro: erroCatalogo,
  } = useFetch<Catalogo>((signal) => api.get<Catalogo>('/catalogos', { signal }), [])

  const isCadastro = modo === 'cadastro'

  function limpar() {
    setErros({})
  }

  function redirecionarPorPerfil(usuario: Usuario) {
    if (usuario.perfil === Perfil.EMPRESA) navigate('/empresa')
    else if (usuario.perfil === Perfil.MOTORISTA) navigate('/motorista')
    else if (usuario.perfil === Perfil.ADMIN) navigate('/admin')
    else navigate('/')
  }

  /** Mapeia erros Zod (path -> mensagem) para o estado de erros por campo. */
  function aplicarErrosZod(fieldErrors: Record<string, string[] | undefined>): void {
    const mapeado: Erros = {}
    for (const [campo, msgs] of Object.entries(fieldErrors)) {
      if (msgs && msgs.length) mapeado[campo] = msgs[0]
    }
    setErros(mapeado)
  }

  /** Mapeia erros do backend (ApiError.errors) para o estado por campo. */
  function aplicarErrosApi(err: ApiError): void {
    if (err.errors) {
      const mapeado: Erros = {}
      for (const [campo, msgs] of Object.entries(err.errors)) {
        if (msgs && msgs.length) mapeado[campo] = msgs[0]
      }
      setErros(mapeado)
    }
    toast.erro(err.message)
  }

  async function submeterLogin() {
    const parsed = loginSchema.safeParse({ email, senha })
    if (!parsed.success) {
      aplicarErrosZod(parsed.error.flatten().fieldErrors)
      return
    }
    setEnviando(true)
    try {
      const usuario = await login(parsed.data.email, parsed.data.senha)
      toast.sucesso(`Bem-vindo(a), ${usuario.nome}!`)
      redirecionarPorPerfil(usuario)
    } catch (e) {
      if (e instanceof ApiError) aplicarErrosApi(e)
      else toast.erro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function submeterCadastroEmpresa() {
    const parsed = cadastroEmpresaSchema.safeParse({
      tipo: Perfil.EMPRESA,
      razaoSocial,
      nomeFantasia,
      cnpj,
      telefone,
      email,
      senha,
      confirmarSenha,
    })
    if (!parsed.success) {
      aplicarErrosZod(parsed.error.flatten().fieldErrors)
      return
    }
    setEnviando(true)
    try {
      await api.post<Usuario>('/cadastrar', {
        tipo: Perfil.EMPRESA,
        nome: parsed.data.nomeFantasia,
        email: parsed.data.email,
        senha: parsed.data.senha,
        confirmar_senha: parsed.data.confirmarSenha,
        empresa: {
          razao_social: parsed.data.razaoSocial,
          nome_fantasia: parsed.data.nomeFantasia,
          cnpj: apenasDigitos(parsed.data.cnpj),
          telefone: apenasDigitos(parsed.data.telefone),
        },
      })
      // "Criar conta e entrar": após o cadastro (stateless), faz login p/ criar a sessão.
      const logado = await login(parsed.data.email, parsed.data.senha)
      toast.sucesso('Conta criada com sucesso!')
      redirecionarPorPerfil(logado)
    } catch (e) {
      if (e instanceof ApiError) aplicarErrosApi(e)
      else toast.erro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function submeterCadastroMotorista() {
    const parsed = cadastroMotoristaSchema.safeParse({
      tipo: Perfil.MOTORISTA,
      nome,
      cpf,
      telefone,
      email,
      senha,
      confirmarSenha,
      tipoVeiculoId,
      tipoCarroceriaId,
      placa,
      capacidadeKg,
    })
    if (!parsed.success) {
      aplicarErrosZod(parsed.error.flatten().fieldErrors)
      return
    }
    setEnviando(true)
    try {
      await api.post<Usuario>('/cadastrar', {
        tipo: Perfil.MOTORISTA,
        nome: parsed.data.nome,
        email: parsed.data.email,
        senha: parsed.data.senha,
        confirmar_senha: parsed.data.confirmarSenha,
        motorista: {
          cpf: apenasDigitos(parsed.data.cpf),
          telefone: apenasDigitos(parsed.data.telefone),
          tipo_veiculo_id: parsed.data.tipoVeiculoId,
          tipo_carroceria_id: parsed.data.tipoCarroceriaId,
          placa: parsed.data.placa,
          capacidade_kg: parsed.data.capacidadeKg,
        },
      })
      // "Criar conta e entrar": após o cadastro (stateless), faz login p/ criar a sessão.
      const logado = await login(parsed.data.email, parsed.data.senha)
      toast.sucesso('Conta criada com sucesso!')
      redirecionarPorPerfil(logado)
    } catch (e) {
      if (e instanceof ApiError) aplicarErrosApi(e)
      else toast.erro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    if (!isCadastro) {
      void submeterLogin()
    } else if (papel === 'empresa') {
      void submeterCadastroEmpresa()
    } else {
      void submeterCadastroMotorista()
    }
  }

  function trocarModo(novo: Modo) {
    setModo(novo)
    limpar()
  }

  function trocarPapel(novo: Papel) {
    setPapel(novo)
    limpar()
  }

  const segStyle = (on: boolean): CSSProperties => ({
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${on ? colors.primary : colors.borderInput}`,
    background: on ? colors.tintBlue : '#fff',
    color: on ? colors.tintBlueText : colors.muted3,
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
  })
  const tabSty = (on: boolean): CSSProperties => ({
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: on ? '#fff' : 'transparent',
    color: on ? colors.ink : colors.muted,
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: on ? '0 1px 2px rgba(16,24,40,.12)' : 'none',
  })

  function campoErro(nome: string) {
    const msg = erros[nome]
    if (!msg) return null
    return <span style={{ ...erroStyle, color: erroColor }}>{msg}</span>
  }

  const inputErroStyle = (nome: string): CSSProperties =>
    erros[nome] ? { ...inputStyle, borderColor: erroColor } : inputStyle

  const RolePicker = (
    <>
      <label style={{ ...lblStyle, marginBottom: '8px' }}>
        {isCadastro ? 'Quero me cadastrar como' : 'Entrar como'}
      </label>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => trocarPapel('motorista')}
          style={segStyle(papel === 'motorista')}
        >
          Motorista
        </button>
        <button
          type="button"
          onClick={() => trocarPapel('empresa')}
          style={segStyle(papel === 'empresa')}
        >
          Empresa
        </button>
      </div>
    </>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: fonts.body,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <img
          src="/assets/giro_logo.svg"
          alt=""
          style={{ height: '48px', width: 'auto', display: 'block' }}
        />
        <img
          src="/assets/giro_nome.svg"
          alt="GiroChoffer"
          style={{ height: '36px', width: 'auto', display: 'block' }}
        />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '18px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(16,24,40,.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: '#F1F4F8',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '26px',
          }}
        >
          <button type="button" onClick={() => trocarModo('cadastro')} style={tabSty(isCadastro)}>
            Criar conta
          </button>
          <button type="button" onClick={() => trocarModo('login')} style={tabSty(!isCadastro)}>
            Entrar
          </button>
        </div>

        <h2
          style={{
            fontFamily: fonts.heading,
            fontWeight: 800,
            fontSize: '24px',
            color: colors.inkStrong,
            margin: '0 0 22px',
          }}
        >
          {isCadastro ? 'Criar sua conta' : 'Entrar na sua conta'}
        </h2>

        <form onSubmit={onSubmit} noValidate>
          {isCadastro ? (
            <>
              {RolePicker}

              {papel === 'empresa' ? (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lblStyle}>Razão social</label>
                    <input
                      style={inputErroStyle('razaoSocial')}
                      placeholder="Sua empresa Ltda"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                    />
                    {campoErro('razaoSocial')}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lblStyle}>Nome fantasia</label>
                    <input
                      style={inputErroStyle('nomeFantasia')}
                      placeholder="Sua Empresa"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                    />
                    {campoErro('nomeFantasia')}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lblStyle}>CNPJ</label>
                    <input
                      style={inputErroStyle('cnpj')}
                      placeholder="00.000.000/0000-00"
                      inputMode="numeric"
                      value={cnpj}
                      onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
                    />
                    {campoErro('cnpj')}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lblStyle}>Nome completo</label>
                    <input
                      style={inputErroStyle('nome')}
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                    {campoErro('nome')}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lblStyle}>CPF</label>
                    <input
                      style={inputErroStyle('cpf')}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      value={cpf}
                      onChange={(e) => setCpf(mascararCpf(e.target.value))}
                    />
                    {campoErro('cpf')}
                  </div>
                </>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <label style={lblStyle}>E-mail</label>
                  <input
                    type="email"
                    style={inputErroStyle('email')}
                    placeholder="email@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {campoErro('email')}
                </div>
                <div>
                  <label style={lblStyle}>Telefone</label>
                  <input
                    style={inputErroStyle('telefone')}
                    placeholder="(11) 90000-0000"
                    inputMode="numeric"
                    value={telefone}
                    onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                  />
                  {campoErro('telefone')}
                </div>
              </div>

              {papel === 'motorista' && (
                <>
                  {carregandoCatalogo ? (
                    <div style={{ marginBottom: '14px' }}>
                      <Spinner texto="Carregando opções de veículo..." />
                    </div>
                  ) : erroCatalogo ? (
                    <div style={{ ...erroStyle, color: erroColor, marginBottom: '14px' }}>
                      Não foi possível carregar os tipos de veículo. Recarregue a página.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '14px',
                        }}
                      >
                        <div>
                          <label style={lblStyle}>Tipo de veículo</label>
                          <select
                            style={{ ...inputErroStyle('tipoVeiculoId'), ...selectArrow }}
                            value={tipoVeiculoId}
                            onChange={(e) => setTipoVeiculoId(e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {catalogo?.tipos_veiculo.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nome}
                              </option>
                            ))}
                          </select>
                          {campoErro('tipoVeiculoId')}
                        </div>
                        <div>
                          <label style={lblStyle}>Carroceria</label>
                          <select
                            style={{ ...inputErroStyle('tipoCarroceriaId'), ...selectArrow }}
                            value={tipoCarroceriaId}
                            onChange={(e) => setTipoCarroceriaId(e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {catalogo?.carrocerias.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </select>
                          {campoErro('tipoCarroceriaId')}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '14px',
                        }}
                      >
                        <div>
                          <label style={lblStyle}>Placa</label>
                          <input
                            style={inputErroStyle('placa')}
                            placeholder="ABC1D23"
                            value={placa}
                            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                          />
                          {campoErro('placa')}
                        </div>
                        <div>
                          <label style={lblStyle}>Capacidade (kg)</label>
                          <input
                            style={inputErroStyle('capacidadeKg')}
                            placeholder="12000"
                            inputMode="numeric"
                            value={capacidadeKg}
                            onChange={(e) =>
                              setCapacidadeKg(apenasDigitos(e.target.value))
                            }
                          />
                          {campoErro('capacidadeKg')}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={lblStyle}>Senha</label>
                <input
                  type="password"
                  style={inputErroStyle('senha')}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                {campoErro('senha')}
              </div>
              <div style={{ marginBottom: '22px' }}>
                <label style={lblStyle}>Confirmar senha</label>
                <input
                  type="password"
                  style={inputErroStyle('confirmarSenha')}
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
                {campoErro('confirmarSenha')}
              </div>

              <Button
                type="submit"
                disabled={enviando}
                style={{ ...submitBtnStyle, opacity: enviando ? 0.7 : 1 }}
                hoverStyle={{ background: colors.primaryHover }}
              >
                {enviando ? 'Criando conta...' : 'Criar conta e entrar'}
              </Button>
            </>
          ) : (
            <>
              {RolePicker}
              <div style={{ marginBottom: '14px' }}>
                <label style={lblStyle}>E-mail</label>
                <input
                  type="email"
                  style={inputErroStyle('email')}
                  placeholder="email@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {campoErro('email')}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={lblStyle}>Senha</label>
                <input
                  type="password"
                  style={inputErroStyle('senha')}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                {campoErro('senha')}
              </div>
              <div style={{ textAlign: 'right', marginBottom: '22px' }}>
                <a
                  onClick={() => navigate('/recuperar-senha')}
                  style={{
                    fontSize: '13px',
                    color: colors.primary,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Esqueci minha senha
                </a>
              </div>
              <Button
                type="submit"
                disabled={enviando}
                style={{ ...submitBtnStyle, opacity: enviando ? 0.7 : 1 }}
                hoverStyle={{ background: colors.primaryHover }}
              >
                {enviando ? 'Entrando...' : 'Entrar'}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
