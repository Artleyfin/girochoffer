import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, ApiError } from '@/lib/api'
import { StatusCarga, type CargaDetalhe } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'
import { colors, fonts } from '@/lib/theme'
import { useFetch } from '@/hooks/useFetch'
import { toast, useUIStore } from '@/store/uiStore'
import CargaDetalheCard from '@/components/giro/CargaDetalheCard'
import MotoristaInteressadoCard from '@/components/giro/MotoristaInteressadoCard'
import EmptyState from '@/components/giro/EmptyState'
import Spinner from '@/components/ui/Spinner'

/* Detalhes de uma carga na visão da EMPRESA (rota /empresa/carga/:id).
   Portado de design/girochoffer-react/src/pages/EmpresaDetalhes.jsx, usando a
   infra de produção (api central, tipos do contrato, feedback via uiStore). */

/* Rótulo derivado: carga disponível com interessados aparece como
   "Com interessados" (não é status armazenado). */
function rotuloStatus(carga: CargaDetalhe): string {
  if (carga.status === StatusCarga.DISPONIVEL && carga.total_interesses > 0) {
    return 'Com interessados'
  }
  return carga.status
}

export default function EmpresaDetalhesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [agindo, setAgindo] = useState(false)

  const carregar = useCallback(
    (signal: AbortSignal) => api.get<CargaDetalhe>(`/empresa/cargas/${id}`, { signal }),
    [id],
  )
  const { data: carga, carregando, erro, recarregar } = useFetch<CargaDetalhe>(carregar, [id])

  async function executarAcao(fn: () => Promise<unknown>, mensagemSucesso: string) {
    setAgindo(true)
    try {
      await fn()
      toast.sucesso(mensagemSucesso)
      recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível concluir a operação.')
    } finally {
      setAgindo(false)
    }
  }

  function escolher(motoristaId: number, nomeMotorista: string) {
    pedirConfirmacao({
      titulo: 'Escolher motorista',
      mensagem: `Confirmar a contratação de ${nomeMotorista} para esta carga?`,
      detalhes: 'A carga passará para o status "Contratada" e os demais interessados não poderão ser escolhidos.',
      textoConfirmar: 'Escolher',
      onConfirmar: () =>
        executarAcao(
          () => api.patch(`/empresa/cargas/${id}/escolher`, { motorista_id: motoristaId }),
          'Motorista escolhido. Carga contratada.',
        ),
    })
  }

  function concluir() {
    pedirConfirmacao({
      titulo: 'Concluir carga',
      mensagem: 'Marcar esta carga como concluída?',
      textoConfirmar: 'Concluir',
      onConfirmar: () =>
        executarAcao(() => api.patch(`/empresa/cargas/${id}/concluir`), 'Carga concluída.'),
    })
  }

  function cancelar() {
    pedirConfirmacao({
      titulo: 'Cancelar carga',
      mensagem: 'Tem certeza que deseja cancelar esta carga?',
      detalhes: 'Esta ação não pode ser desfeita.',
      textoConfirmar: 'Cancelar carga',
      textoCancelar: 'Voltar',
      tipo: 'danger',
      onConfirmar: () =>
        executarAcao(() => api.patch(`/empresa/cargas/${id}/cancelar`), 'Carga cancelada.'),
    })
  }

  if (carregando) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
        <Spinner texto="Carregando carga..." />
      </div>
    )
  }

  if (erro || !carga) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
        <button onClick={() => navigate('/empresa')} style={voltarStyle}>
          ← Voltar ao painel
        </button>
        <EmptyState padding="48px">
          {erro?.status === 404
            ? 'Carga não encontrada.'
            : erro?.message ?? 'Não foi possível carregar esta carga.'}
        </EmptyState>
      </div>
    )
  }

  const statusLabel = rotuloStatus(carga)
  const isContratada = carga.status === StatusCarga.CONTRATADA
  const isDisponivel = carga.status === StatusCarga.DISPONIVEL
  const interessados = carga.interessados

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button onClick={() => navigate('/empresa')} style={voltarStyle}>
        ← Voltar ao painel
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <CargaDetalheCard carga={carga} statusLabel={statusLabel} />

        <div>
          <div style={{ background: colors.navy, borderRadius: '16px', padding: '26px', color: '#fff', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', color: '#9FC2E0', marginBottom: '4px' }}>Valor do frete</div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: '36px', lineHeight: 1 }}>
              {formatarMoeda(carga.valor_frete)}
            </div>
          </div>

          {isContratada && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E8E5A', marginBottom: '12px' }}>✓ Carga contratada</div>
              <button onClick={concluir} disabled={agindo} style={btnConcluir(agindo)}>
                Marcar como concluída
              </button>
              <button onClick={cancelar} disabled={agindo} style={btnCancelar(agindo)}>
                Cancelar carga
              </button>
            </div>
          )}
          {isDisponivel && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '20px' }}>
              <button onClick={cancelar} disabled={agindo} style={btnCancelar(agindo)}>
                Cancelar carga
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '20px', color: colors.inkStrong, margin: '0 0 16px' }}>
          Motoristas interessados
        </h2>
        {interessados.length === 0 ? (
          <EmptyState padding="40px">Ainda não há motoristas interessados nesta carga.</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {interessados.map((m) => (
              <MotoristaInteressadoCard
                key={m.id}
                motorista={m}
                escolhido={carga.motorista_escolhido_id === m.id}
                podeEscolher={!carga.motorista_escolhido_id && isDisponivel && !agindo}
                onEscolher={() => escolher(m.id, m.nome)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const voltarStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.muted,
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  padding: 0,
  marginBottom: '16px',
}

function btnConcluir(agindo: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px',
    background: '#1E8E5A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: agindo ? 'not-allowed' : 'pointer',
    marginBottom: '10px',
    opacity: agindo ? 0.6 : 1,
  }
}

function btnCancelar(agindo: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px',
    background: '#fff',
    color: '#C0392B',
    border: '1px solid #F0D2CE',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: agindo ? 'not-allowed' : 'pointer',
    opacity: agindo ? 0.6 : 1,
  }
}
