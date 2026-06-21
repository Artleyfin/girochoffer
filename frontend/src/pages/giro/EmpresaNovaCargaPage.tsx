import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { novaCargaSchema } from '@/lib/schemas'
import type { Carga, Catalogo } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { toast } from '@/store/uiStore'
import { useFetch } from '@/hooks/useFetch'
import Button from '@/components/giro/Button'
import { TextInput, SelectInput, TextArea } from '@/components/giro/FormControls'
import Spinner from '@/components/ui/Spinner'

/* Página de publicação de nova carga (rota /empresa/nova).
   Portada fielmente do design (design/girochoffer-react/src/pages/EmpresaNovaCarga.jsx),
   trocando mocks/AppContext pela infra real: catálogos via /catalogos, validação Zod
   (novaCargaSchema) e criação via POST /empresa/cargas. */

interface FormState {
  titulo: string
  origem: string
  destino: string
  tipoVeiculoId: string
  tipoCarroceriaId: string
  pesoKg: string
  volumeM3: string
  valorFrete: string
  dataColeta: string
  descricao: string
}

const inicial: FormState = {
  titulo: '',
  origem: '',
  destino: '',
  tipoVeiculoId: '',
  tipoCarroceriaId: '',
  pesoKg: '',
  volumeM3: '',
  valorFrete: '',
  dataColeta: '',
  descricao: '',
}

type Erros = Partial<Record<keyof FormState, string>>

export default function EmpresaNovaCargaPage() {
  const navigate = useNavigate()
  const { data: catalogo, carregando, erro } = useFetch<Catalogo>(
    (signal) => api.get<Catalogo>('/catalogos', { signal }),
    [],
  )

  const [form, setForm] = useState<FormState>(inicial)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const set =
    (k: keyof FormState) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const onPublicar = async () => {
    setErros({})

    // Mapeia campos vazios opcionais para undefined antes da validação Zod.
    const parsed = novaCargaSchema.safeParse({
      titulo: form.titulo,
      origem: form.origem,
      destino: form.destino,
      tipoVeiculoId: form.tipoVeiculoId,
      tipoCarroceriaId: form.tipoCarroceriaId,
      pesoKg: form.pesoKg.trim() === '' ? undefined : form.pesoKg,
      volumeM3: form.volumeM3.trim() === '' ? undefined : form.volumeM3,
      valorFrete: form.valorFrete,
      dataColeta: form.dataColeta.trim() === '' ? undefined : form.dataColeta,
      descricao: form.descricao,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const novos: Erros = {}
      for (const [campo, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length > 0) novos[campo as keyof FormState] = msgs[0]
      }
      setErros(novos)
      toast.erro('Verifique os campos destacados.')
      return
    }

    const dados = parsed.data
    setEnviando(true)
    try {
      await api.post<Carga>('/empresa/cargas', {
        titulo: dados.titulo,
        origem: dados.origem,
        destino: dados.destino,
        tipo_veiculo_id: dados.tipoVeiculoId,
        tipo_carroceria_id: dados.tipoCarroceriaId,
        peso_kg: dados.pesoKg ?? null,
        volume_m3: dados.volumeM3 ?? null,
        valor_frete: dados.valorFrete,
        data_coleta: dados.dataColeta ?? null,
        descricao: dados.descricao,
      })
      toast.sucesso('Carga publicada com sucesso!')
      navigate('/empresa')
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        // Mapeia erros de validação (snake_case do backend) para os campos camelCase.
        const mapa: Record<string, keyof FormState> = {
          titulo: 'titulo',
          origem: 'origem',
          destino: 'destino',
          tipo_veiculo_id: 'tipoVeiculoId',
          tipo_carroceria_id: 'tipoCarroceriaId',
          peso_kg: 'pesoKg',
          volume_m3: 'volumeM3',
          valor_frete: 'valorFrete',
          data_coleta: 'dataColeta',
          descricao: 'descricao',
        }
        const novos: Erros = {}
        for (const [campo, msgs] of Object.entries(e.errors)) {
          const chave = mapa[campo]
          if (chave && msgs && msgs.length > 0) novos[chave] = msgs[0]
        }
        setErros(novos)
        toast.erro(e.message || 'Não foi possível publicar a carga.')
      } else {
        toast.erro(e instanceof Error ? e.message : 'Não foi possível publicar a carga.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const erroEstilo = { marginTop: '6px', fontSize: '12px', color: colors.primary } as const
  const campoErro = (k: keyof FormState) =>
    erros[k] ? <p style={{ ...erroEstilo, color: '#C0392B' }}>{erros[k]}</p> : null

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button
        onClick={() => navigate('/empresa')}
        style={{
          background: 'none',
          border: 'none',
          color: colors.muted,
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
        }}
      >
        ← Voltar ao painel
      </button>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontWeight: 800,
          fontSize: '30px',
          color: colors.inkStrong,
          margin: '0 0 4px',
        }}
      >
        Publicar nova carga
      </h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Preencha os dados do frete. Ele ficará disponível para os motoristas imediatamente.
      </p>

      <div
        style={{
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '30px',
        }}
      >
        {carregando ? (
          <Spinner texto="Carregando catálogos..." />
        ) : erro ? (
          <p style={{ color: '#C0392B', fontSize: '14px', margin: 0 }}>
            Não foi possível carregar os catálogos. Tente recarregar a página.
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '18px' }}>
              <TextInput
                label="Título da carga"
                value={form.titulo}
                onChange={set('titulo')}
                placeholder="Ex.: Eletrodomésticos — linha branca"
              />
              {campoErro('titulo')}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <TextInput
                  label="Origem"
                  value={form.origem}
                  onChange={set('origem')}
                  placeholder="Cidade/UF"
                />
                {campoErro('origem')}
              </div>
              <div>
                <TextInput
                  label="Destino"
                  value={form.destino}
                  onChange={set('destino')}
                  placeholder="Cidade/UF"
                />
                {campoErro('destino')}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <SelectInput
                  label="Tipo de veículo"
                  value={form.tipoVeiculoId}
                  onChange={set('tipoVeiculoId')}
                >
                  <option value="">Selecione...</option>
                  {catalogo?.tipos_veiculo.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </SelectInput>
                {campoErro('tipoVeiculoId')}
              </div>
              <div>
                <SelectInput
                  label="Tipo de carroceria"
                  value={form.tipoCarroceriaId}
                  onChange={set('tipoCarroceriaId')}
                >
                  <option value="">Selecione...</option>
                  {catalogo?.carrocerias.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </SelectInput>
                {campoErro('tipoCarroceriaId')}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <TextInput
                  label="Peso (kg)"
                  value={form.pesoKg}
                  onChange={set('pesoKg')}
                  placeholder="Ex.: 8500"
                  inputMode="numeric"
                />
                {campoErro('pesoKg')}
              </div>
              <div>
                <TextInput
                  label="Valor do frete (R$)"
                  value={form.valorFrete}
                  onChange={set('valorFrete')}
                  placeholder="Ex.: 4200"
                  inputMode="decimal"
                />
                {campoErro('valorFrete')}
              </div>
              <div>
                <TextInput
                  label="Data de coleta"
                  value={form.dataColeta}
                  onChange={set('dataColeta')}
                  placeholder="dd/mm/aaaa"
                />
                {campoErro('dataColeta')}
              </div>
            </div>

            <div style={{ marginBottom: '26px' }}>
              <TextArea
                label="Descrição"
                rows={4}
                value={form.descricao}
                onChange={set('descricao')}
                placeholder="Detalhes da carga, exigências de manuseio, agendamento de descarga..."
              />
              {campoErro('descricao')}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate('/empresa')}
                disabled={enviando}
                style={{
                  padding: '13px 24px',
                  background: '#fff',
                  color: colors.ink,
                  border: `1px solid ${colors.borderInput}`,
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <Button
                onClick={onPublicar}
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
                {enviando ? 'Publicando...' : 'Publicar carga'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
