import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, ApiError } from '@/lib/api'
import type { CargaDetalheMotorista } from '@/lib/types'
import { StatusCarga } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { formatarMoeda } from '@/lib/format'
import { toast } from '@/store/uiStore'
import { useFetch } from '@/hooks/useFetch'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/giro/Button'
import CargaDetalheCard from '@/components/giro/CargaDetalheCard'

/* Detalhe de uma carga na visão do MOTORISTA (rota /motorista/carga/:id).
   Portado de design/girochoffer-react/src/pages/MotoristaDetalhes.jsx,
   trocando o AppContext mockado por chamadas reais à API. */
export default function MotoristaDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(
    (signal: AbortSignal) => api.get<CargaDetalheMotorista>(`/motorista/cargas/${id}`, { signal }),
    [id],
  )
  const { data: carga, carregando, erro, recarregar } = useFetch(carregar, [id])

  async function registrarInteresse() {
    if (!carga || enviando) return
    setEnviando(true)
    try {
      await api.post(`/motorista/cargas/${carga.id}/interesse`)
      toast.sucesso('Interesse enviado. Contato da empresa liberado.')
      recarregar()
    } catch (e) {
      if (e instanceof ApiError) {
        toast.erro(e.status === 409 ? 'Você já demonstrou interesse nesta carga.' : e.message)
      } else {
        toast.erro('Não foi possível registrar seu interesse.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
        <Spinner />
      </div>
    )
  }

  if (erro || !carga) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
        <EmptyState
          titulo="Carga não encontrada"
          mensagem={erro?.message ?? 'Esta carga não está mais disponível.'}
        />
        <div style={{ marginTop: '16px' }}>
          <Button
            onClick={() => navigate('/motorista')}
            style={{
              padding: '12px 20px',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
            hoverStyle={{ background: colors.primaryHover }}
          >
            Voltar às cargas
          </Button>
        </div>
      </div>
    )
  }

  const jaInteresse = carga.ja_tenho_interesse
  const podeInteresse = carga.status === StatusCarga.DISPONIVEL && !jaInteresse
  const contato = carga.contato_liberado ? carga.empresa_contato : null

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button
        onClick={() => navigate('/motorista')}
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
        ← Voltar às cargas
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <CargaDetalheCard
          carga={carga}
          statusLabel={carga.status_rotulo}
          subtitulo={`Publicada por ${carga.empresa_nome}`}
        />

        <div>
          <div
            style={{
              background: colors.navy,
              borderRadius: '16px',
              padding: '26px',
              color: '#fff',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#9FC2E0', marginBottom: '4px' }}>Valor do frete</div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 900, fontSize: '36px', lineHeight: 1 }}>
              {formatarMoeda(carga.valor_frete)}
            </div>
          </div>

          {podeInteresse && (
            <Button
              onClick={registrarInteresse}
              disabled={enviando}
              style={{
                width: '100%',
                padding: '16px',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.7 : 1,
              }}
              hoverStyle={{ background: colors.primaryHover }}
            >
              {enviando ? 'Enviando...' : 'Tenho interesse'}
            </Button>
          )}

          {contato && (
            <div style={{ background: '#fff', border: '1px solid #CDE8D9', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E8E5A', marginBottom: '12px' }}>
                ✓ Interesse enviado — contato liberado
              </div>

              <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>Empresa</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.ink, marginBottom: '10px' }}>
                {contato.nome_fantasia}
              </div>

              <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>Telefone</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.ink, marginBottom: '10px' }}>
                <a href={`tel:${contato.telefone}`} style={{ color: colors.primary, textDecoration: 'none' }}>
                  {contato.telefone}
                </a>
              </div>

              {contato.whatsapp && (
                <>
                  <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>WhatsApp</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>
                    <a
                      href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1E8E5A', textDecoration: 'none' }}
                    >
                      {contato.whatsapp}
                    </a>
                  </div>
                </>
              )}

              <div style={{ fontSize: '12px', color: colors.muted2, marginBottom: '2px' }}>E-mail</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.ink, marginBottom: '16px' }}>
                <a href={`mailto:${contato.email}`} style={{ color: colors.primary, textDecoration: 'none' }}>
                  {contato.email}
                </a>
              </div>

              <button
                onClick={() => navigate('/motorista/minhas')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#fff',
                  color: colors.primary,
                  border: '1px solid #BBD9F1',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Ver em Minhas cargas
              </button>
            </div>
          )}

          {jaInteresse && !contato && (
            <div
              style={{
                background: '#E3F4EC',
                border: '1px solid #CDE8D9',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1E8E5A',
              }}
            >
              ✓ Interesse já registrado nesta carga.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
