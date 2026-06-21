// Tipos TypeScript espelhando os schemas de resposta do backend (dtos/responses/).
// Enums são strings de valor (ex: "Disponível", "Administrador"), nunca índices.

// ===== Enums de domínio =====
export const Perfil = {
  ADMIN: 'Administrador',
  EMPRESA: 'Empresa',
  MOTORISTA: 'Motorista',
} as const
export type PerfilValor = (typeof Perfil)[keyof typeof Perfil]

export const StatusCarga = {
  DISPONIVEL: 'Disponível',
  CONTRATADA: 'Contratada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
} as const
export type StatusCargaValor = (typeof StatusCarga)[keyof typeof StatusCarga]

export type TipoNotificacao = 'info' | 'sucesso' | 'aviso' | 'erro'

// ===== Comuns =====
export interface MensagemResponse {
  message: string
}
export interface TokenCsrfResponse {
  token: string
}
export interface PaginaResponse<T> {
  items: T[]
  pagina: number
  por_pagina: number
  total: number
  total_paginas: number
}

// ===== Usuário =====
export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: string
  telefone?: string | null
  foto_url?: string | null
  data_cadastro?: string | null
  data_atualizacao?: string | null
}

// ===== Catálogos (referência) =====
export interface CatalogoItem {
  id: number
  nome: string
}
export interface Catalogo {
  tipos_veiculo: CatalogoItem[]
  carrocerias: CatalogoItem[]
}

// ===== Veículo =====
export interface Veiculo {
  id: number
  tipo_veiculo: string
  carroceria: string
  placa: string
  capacidade_kg: number
  ativo: boolean
}

// ===== Empresa =====
export interface Empresa {
  id: number
  nome: string
  email: string
  telefone: string
  cnpj: string
  razao_social: string
  nome_fantasia: string
  whatsapp?: string | null
  foto_url?: string | null
  verificada: boolean
}
export interface EmpresaContato {
  telefone: string
  whatsapp?: string | null
  email: string
  nome_fantasia: string
}

// ===== Motorista =====
export interface MotoristaResumo {
  id: number
  nome: string
  cidade?: string | null
  nota: number
  total_viagens: number
  foto_url?: string | null
  veiculo_principal: string
  carroceria: string
  capacidade_kg: number
}
export interface Motorista {
  id: number
  nome: string
  email: string
  telefone: string
  cpf: string
  cidade?: string | null
  nota: number
  total_viagens: number
  foto_url?: string | null
  verificado: boolean
  veiculos: Veiculo[]
}

// ===== Carga =====
export interface CargaResumo {
  id: number
  titulo: string
  origem: string
  destino: string
  tipo_veiculo: string
  carroceria: string
  peso_kg?: number | null
  valor_frete: number
  status: string
  status_rotulo: string
  total_interesses: number
  foto_url?: string | null
  empresa_nome: string
  data_coleta?: string | null
}
export interface Carga extends CargaResumo {
  descricao: string
  volume_m3?: number | null
  empresa_id: number
  motorista_escolhido_id?: number | null
  data_publicacao?: string | null
}
// Detalhe na rota da EMPRESA: inclui a lista de interessados.
export interface CargaDetalhe extends Carga {
  interessados: MotoristaResumo[]
}
// Detalhe na rota do MOTORISTA: inclui flags de interesse/contato.
export interface CargaDetalheMotorista extends Carga {
  ja_tenho_interesse: boolean
  contato_liberado: boolean
  empresa_contato?: EmpresaContato | null
}

// ===== Minhas cargas (painel do motorista) =====
export interface MinhasCargas {
  interesse_enviado: CargaResumo[]
  contratadas: CargaResumo[]
  concluidas: CargaResumo[]
}

// ===== Dashboard admin =====
// Espelha backend/dtos/responses/admin_dashboard_response.py
export interface ContagemItem {
  rotulo: string
  total: number
}
export interface SerieMensalItem {
  mes: string
  rotulo: string
  total: number
}
export interface AdminDashboard {
  total_usuarios: number
  total_empresas: number
  total_motoristas: number
  total_cargas: number
  cargas_por_status: ContagemItem[]
  usuarios_por_perfil: ContagemItem[]
  cadastros_por_mes: SerieMensalItem[]
}
