import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { api, ApiError } from '@/lib/api'
import { atualizarEmpresaSchema, atualizarMotoristaSchema } from '@/lib/schemas'
import type { Catalogo, Empresa, Motorista } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { toast } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useFetch } from '@/hooks/useFetch'
import Button from '@/components/giro/Button'
import { TextInput, SelectInput } from '@/components/giro/FormControls'
import Spinner from '@/components/ui/Spinner'

/* Página de edição do perfil (rota /perfil).
   Portada fielmente do design (design/girochoffer-react/src/pages/Perfil.jsx),
   trocando mocks/AppContext pela infra real: dados/sessão via authStore, leitura e
   gravação via /empresa/perfil ou /motorista/perfil (conforme o perfil logado),
   validação Zod (atualizarEmpresaSchema / atualizarMotoristaSchema) e catálogos
   (/catalogos) para os selects do veículo do motorista. */

const erroEstilo: CSSProperties = { marginTop: '6px', fontSize: '12px', color: '#C0392B' }

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '30px',
      }}
    >
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: '18px',
          color: colors.inkStrong,
          marginBottom: '20px',
        }}
      >
        {titulo}
      </div>
      {children}
    </div>
  )
}

function BotaoSalvar({ onClick, enviando }: { onClick: () => void; enviando: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        onClick={onClick}
        disabled={enviando}
        style={{
          padding: '13px 28px',
          background: colors.primary,
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '15px',
          cursor: enviando ? 'not-allowed' : 'pointer',
          opacity: enviando ? 0.7 : 1,
        }}
        hoverStyle={{ background: colors.primaryHover }}
      >
        {enviando ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  )
}

// ===== Bloco Empresa =====

interface EmpresaFormState {
  razaoSocial: string
  nomeFantasia: string
  telefone: string
  whatsapp: string
}

type EmpresaErros = Partial<Record<keyof EmpresaFormState, string>>

function PerfilEmpresa() {
  const { data, carregando, erro } = useFetch<Empresa>(
    (signal) => api.get<Empresa>('/empresa/perfil', { signal }),
    [],
  )

  if (carregando) return <Spinner texto="Carregando perfil..." />
  if (erro || !data) {
    return (
      <p style={{ color: '#C0392B', fontSize: '14px', margin: 0 }}>
        Não foi possível carregar o perfil. Tente recarregar a página.
      </p>
    )
  }

  return <PerfilEmpresaForm empresa={data} />
}

function PerfilEmpresaForm({ empresa }: { empresa: Empresa }) {
  const [form, setForm] = useState<EmpresaFormState>({
    razaoSocial: empresa.razao_social,
    nomeFantasia: empresa.nome_fantasia,
    telefone: empresa.telefone,
    whatsapp: empresa.whatsapp ?? '',
  })
  const [erros, setErros] = useState<EmpresaErros>({})
  const [enviando, setEnviando] = useState(false)

  const set =
    (k: keyof EmpresaFormState) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const campoErro = (k: keyof EmpresaFormState) =>
    erros[k] ? <p style={erroEstilo}>{erros[k]}</p> : null

  const onSalvar = async () => {
    setErros({})
    const parsed = atualizarEmpresaSchema.safeParse({
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia,
      telefone: form.telefone,
      whatsapp: form.whatsapp.trim() === '' ? undefined : form.whatsapp,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const novos: EmpresaErros = {}
      for (const [campo, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length > 0) novos[campo as keyof EmpresaFormState] = msgs[0]
      }
      setErros(novos)
      toast.erro('Verifique os campos destacados.')
      return
    }

    const dados = parsed.data
    setEnviando(true)
    try {
      await api.put<Empresa>('/empresa/perfil', {
        razao_social: dados.razaoSocial,
        nome_fantasia: dados.nomeFantasia,
        telefone: dados.telefone,
        whatsapp: dados.whatsapp ?? null,
      })
      toast.sucesso('Alterações salvas com sucesso.')
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const mapa: Record<string, keyof EmpresaFormState> = {
          razao_social: 'razaoSocial',
          nome_fantasia: 'nomeFantasia',
          telefone: 'telefone',
          whatsapp: 'whatsapp',
        }
        const novos: EmpresaErros = {}
        for (const [campo, msgs] of Object.entries(e.errors)) {
          const chave = mapa[campo]
          if (chave && msgs && msgs.length > 0) novos[chave] = msgs[0]
        }
        setErros(novos)
        toast.erro(e.message || 'Não foi possível salvar as alterações.')
      } else {
        toast.erro(e instanceof Error ? e.message : 'Não foi possível salvar as alterações.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Cartao titulo="Dados da empresa">
      {empresa.foto_url && (
        <img
          src={empresa.foto_url}
          alt={empresa.nome_fantasia}
          style={{ width: '88px', height: '88px', borderRadius: '14px', objectFit: 'cover', marginBottom: '20px' }}
        />
      )}
      <div style={{ marginBottom: '16px' }}>
        <TextInput label="Razão social" value={form.razaoSocial} onChange={set('razaoSocial')} />
        {campoErro('razaoSocial')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div>
          <TextInput
            label="Nome fantasia"
            value={form.nomeFantasia}
            onChange={set('nomeFantasia')}
          />
          {campoErro('nomeFantasia')}
        </div>
        <div>
          <TextInput label="CNPJ" value={empresa.cnpj} disabled />
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div>
          <TextInput
            label="Telefone"
            value={form.telefone}
            onChange={set('telefone')}
            placeholder="(00) 0000-0000"
          />
          {campoErro('telefone')}
        </div>
        <div>
          <TextInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            placeholder="(00) 90000-0000"
          />
          {campoErro('whatsapp')}
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <TextInput label="E-mail" value={empresa.email} disabled />
      </div>
      <BotaoSalvar onClick={onSalvar} enviando={enviando} />
    </Cartao>
  )
}

// ===== Bloco Motorista =====

interface MotoristaFormState {
  nome: string
  telefone: string
  cidade: string
  tipoVeiculoId: string
  tipoCarroceriaId: string
  placa: string
  capacidadeKg: string
}

type MotoristaErros = Partial<Record<keyof MotoristaFormState, string>>

function PerfilMotorista() {
  const motoristaState = useFetch<Motorista>(
    (signal) => api.get<Motorista>('/motorista/perfil', { signal }),
    [],
  )
  const catalogoState = useFetch<Catalogo>(
    (signal) => api.get<Catalogo>('/catalogos', { signal }),
    [],
  )

  if (motoristaState.carregando || catalogoState.carregando) {
    return <Spinner texto="Carregando perfil..." />
  }
  if (motoristaState.erro || !motoristaState.data || catalogoState.erro || !catalogoState.data) {
    return (
      <p style={{ color: '#C0392B', fontSize: '14px', margin: 0 }}>
        Não foi possível carregar o perfil. Tente recarregar a página.
      </p>
    )
  }

  return <PerfilMotoristaForm motorista={motoristaState.data} catalogo={catalogoState.data} />
}

function PerfilMotoristaForm({
  motorista,
  catalogo,
}: {
  motorista: Motorista
  catalogo: Catalogo
}) {
  // O contrato atualiza o "1º veículo" (veículo principal).
  const veiculo = motorista.veiculos[0]
  const idPorNome = (lista: Catalogo['tipos_veiculo'], nome?: string) =>
    String(lista.find((c) => c.nome === nome)?.id ?? '')

  const [form, setForm] = useState<MotoristaFormState>({
    nome: motorista.nome,
    telefone: motorista.telefone,
    cidade: motorista.cidade ?? '',
    tipoVeiculoId: idPorNome(catalogo.tipos_veiculo, veiculo?.tipo_veiculo),
    tipoCarroceriaId: idPorNome(catalogo.carrocerias, veiculo?.carroceria),
    placa: veiculo?.placa ?? '',
    capacidadeKg: veiculo ? String(veiculo.capacidade_kg) : '',
  })
  const [erros, setErros] = useState<MotoristaErros>({})
  const [enviando, setEnviando] = useState(false)

  const set =
    (k: keyof MotoristaFormState) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const campoErro = (k: keyof MotoristaFormState) =>
    erros[k] ? <p style={erroEstilo}>{erros[k]}</p> : null

  const onSalvar = async () => {
    setErros({})
    const parsed = atualizarMotoristaSchema.safeParse({
      nome: form.nome,
      telefone: form.telefone,
      cidade: form.cidade.trim() === '' ? undefined : form.cidade,
      tipoVeiculoId: form.tipoVeiculoId,
      tipoCarroceriaId: form.tipoCarroceriaId,
      placa: form.placa,
      capacidadeKg: form.capacidadeKg,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const novos: MotoristaErros = {}
      for (const [campo, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length > 0) novos[campo as keyof MotoristaFormState] = msgs[0]
      }
      setErros(novos)
      toast.erro('Verifique os campos destacados.')
      return
    }

    const dados = parsed.data
    setEnviando(true)
    try {
      await api.put<Motorista>('/motorista/perfil', {
        nome: dados.nome,
        telefone: dados.telefone,
        cidade: dados.cidade ?? null,
        tipo_veiculo_id: dados.tipoVeiculoId,
        tipo_carroceria_id: dados.tipoCarroceriaId,
        placa: dados.placa,
        capacidade_kg: dados.capacidadeKg,
      })
      toast.sucesso('Alterações salvas com sucesso.')
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const mapa: Record<string, keyof MotoristaFormState> = {
          nome: 'nome',
          telefone: 'telefone',
          cidade: 'cidade',
          tipo_veiculo_id: 'tipoVeiculoId',
          tipo_carroceria_id: 'tipoCarroceriaId',
          placa: 'placa',
          capacidade_kg: 'capacidadeKg',
        }
        const novos: MotoristaErros = {}
        for (const [campo, msgs] of Object.entries(e.errors)) {
          const chave = mapa[campo]
          if (chave && msgs && msgs.length > 0) novos[chave] = msgs[0]
        }
        setErros(novos)
        toast.erro(e.message || 'Não foi possível salvar as alterações.')
      } else {
        toast.erro(e instanceof Error ? e.message : 'Não foi possível salvar as alterações.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Cartao titulo="Dados pessoais">
        {motorista.foto_url && (
          <img
            src={motorista.foto_url}
            alt={motorista.nome}
            style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }}
          />
        )}
        <div style={{ marginBottom: '16px' }}>
          <TextInput label="Nome completo" value={form.nome} onChange={set('nome')} />
          {campoErro('nome')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <TextInput
              label="Telefone"
              value={form.telefone}
              onChange={set('telefone')}
              placeholder="(00) 90000-0000"
            />
            {campoErro('telefone')}
          </div>
          <div>
            <TextInput label="E-mail" value={motorista.email} disabled />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <TextInput
            label="Cidade"
            value={form.cidade}
            onChange={set('cidade')}
            placeholder="Cidade/UF"
          />
          {campoErro('cidade')}
        </div>
      </Cartao>

      <Cartao titulo="Meu veículo">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <SelectInput
              label="Tipo de veículo"
              value={form.tipoVeiculoId}
              onChange={set('tipoVeiculoId')}
            >
              <option value="">Selecione...</option>
              {catalogo.tipos_veiculo.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </SelectInput>
            {campoErro('tipoVeiculoId')}
          </div>
          <div>
            <SelectInput
              label="Carroceria"
              value={form.tipoCarroceriaId}
              onChange={set('tipoCarroceriaId')}
            >
              <option value="">Selecione...</option>
              {catalogo.carrocerias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectInput>
            {campoErro('tipoCarroceriaId')}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <TextInput
              label="Capacidade (kg)"
              value={form.capacidadeKg}
              onChange={set('capacidadeKg')}
              placeholder="Ex.: 12000"
              inputMode="numeric"
            />
            {campoErro('capacidadeKg')}
          </div>
          <div>
            <TextInput
              label="Placa"
              value={form.placa}
              onChange={set('placa')}
              placeholder="ABC1D23"
            />
            {campoErro('placa')}
          </div>
        </div>
      </Cartao>

      <BotaoSalvar onClick={onSalvar} enviando={enviando} />
    </div>
  )
}

export default function PerfilPage() {
  const isEmpresa = useAuthStore((s) => s.isEmpresa())

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '30px',
          color: colors.inkStrong,
          margin: '0 0 4px',
        }}
      >
        Meu perfil
      </h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Edite seus dados cadastrais.
      </p>

      {isEmpresa ? <PerfilEmpresa /> : <PerfilMotorista />}
    </div>
  )
}
