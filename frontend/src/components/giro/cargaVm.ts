import type { CargaResumo } from '@/lib/types'
import { formatarMoeda } from '@/lib/format'

/* Campos derivados de uma carga para exibição nos cards.
   Portado de design/girochoffer-react/src/utils/cargaVm.js, adaptado aos
   campos reais do contrato (CargaResumo de dtos/responses). */
export interface CargaVm {
  valorFmt: string
  pesoLabel: string
  coletaLabel: string
  interessadosLabel: string
}

/* Rótulo "N motoristas interessados" / "Sem interessados ainda". */
export function interessadosLabel(total: number): string {
  if (total <= 0) return 'Sem interessados ainda'
  return total + (total > 1 ? ' motoristas interessados' : ' motorista interessado')
}

export function cargaVM(carga: CargaResumo): CargaVm {
  return {
    valorFmt: formatarMoeda(carga.valor_frete),
    pesoLabel: carga.peso_kg != null ? `${carga.peso_kg.toLocaleString('pt-BR')} kg` : 'Peso não informado',
    // data_coleta já vem como string dd/mm/aaaa (seed e formulário); exibir como está.
    coletaLabel: carga.data_coleta?.trim() ? carga.data_coleta.trim() : 'a combinar',
    interessadosLabel: interessadosLabel(carga.total_interesses),
  }
}
