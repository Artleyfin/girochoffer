// Schemas Zod reutilizáveis para validação de formulários.
// Espelham as validações do backend (dtos/validators.py). Enums vêm de types.ts.
import { z } from 'zod'
import { Perfil } from './types'

// ===== Primitivos reutilizáveis =====

/** Regras de senha forte (espelham validar_senha_forte do backend). */
export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos 1 letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'A senha deve conter ao menos um caractere especial.')

export const emailSchema = z.string().min(1, 'Informe o e-mail').email('E-mail inválido')

/** Nome de pessoa: mínimo 4 caracteres, nome + sobrenome, máx 128 (validar_nome_pessoa). */
const nomePessoaSchema = z
  .string()
  .trim()
  .min(4, 'O nome deve ter no mínimo 4 caracteres')
  .max(128, 'O nome deve ter no máximo 128 caracteres')
  .refine((v) => v.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome.')

/** CPF: 11 dígitos numéricos (aceita máscara) — validar_cpf. */
const cpfSchema = z
  .string()
  .min(1, 'Informe o CPF')
  .refine((v) => v.replace(/\D/g, '').length === 11, 'CPF deve conter 11 dígitos.')

/** CNPJ: 14 dígitos numéricos (aceita máscara) — validar_cnpj. */
const cnpjSchema = z
  .string()
  .min(1, 'Informe o CNPJ')
  .refine((v) => v.replace(/\D/g, '').length === 14, 'CNPJ deve conter 14 dígitos.')

/** Telefone BR: 10 ou 11 dígitos (aceita máscara) — validar_telefone_br. */
const telefoneSchema = z
  .string()
  .min(1, 'Informe o telefone')
  .refine((v) => [10, 11].includes(v.replace(/\D/g, '').length), 'Telefone deve ter 10 ou 11 dígitos.')

/** Telefone/WhatsApp opcional: vazio passa; se preenchido, 10 ou 11 dígitos. */
const telefoneOpcionalSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || [10, 11].includes(v.replace(/\D/g, '').length),
    'Telefone deve ter 10 ou 11 dígitos.',
  )

/** Confirmação de senha: campo não vazio. */
const confirmarSenhaSchema = z.string().min(1, 'Confirme a senha')

/** ID de catálogo (tipo de veículo / carroceria): inteiro positivo. */
const idCatalogoSchema = z.coerce
  .number({ message: 'Selecione uma opção' })
  .int('Selecione uma opção')
  .positive('Selecione uma opção')

/** Capacidade em kg: inteiro positivo. */
const capacidadeKgSchema = z.coerce
  .number({ message: 'Informe a capacidade em kg' })
  .int('A capacidade deve ser um número inteiro')
  .positive('A capacidade deve ser maior que zero')

/** Placa: 7 caracteres (padrão antigo ABC1234 ou Mercosul ABC1D23). */
const placaSchema = z
  .string()
  .trim()
  .min(7, 'Placa inválida')
  .max(8, 'Placa inválida')
  .transform((v) => v.toUpperCase())

// ===== Auth =====

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe a senha'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const esqueciSenhaSchema = z.object({
  email: emailSchema,
})
export type EsqueciSenhaForm = z.infer<typeof esqueciSenhaSchema>

export const redefinirSenhaSchema = z
  .object({
    senha: senhaSchema,
    confirmarSenha: confirmarSenhaSchema,
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
export type RedefinirSenhaForm = z.infer<typeof redefinirSenhaSchema>

// ===== Cadastro (composto por perfil) =====

/** Cadastro de Empresa: cria Usuario (perfil fixado no servidor) + Empresa. */
export const cadastroEmpresaSchema = z
  .object({
    tipo: z.literal(Perfil.EMPRESA),
    razaoSocial: z
      .string()
      .trim()
      .min(2, 'Informe a razão social')
      .max(128, 'A razão social deve ter no máximo 128 caracteres'),
    nomeFantasia: z
      .string()
      .trim()
      .min(2, 'Informe o nome fantasia')
      .max(128, 'O nome fantasia deve ter no máximo 128 caracteres'),
    cnpj: cnpjSchema,
    telefone: telefoneSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: confirmarSenhaSchema,
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
export type CadastroEmpresaForm = z.infer<typeof cadastroEmpresaSchema>

/** Cadastro de Motorista: cria Usuario (perfil fixado no servidor) + Motorista + Veículo inicial. */
export const cadastroMotoristaSchema = z
  .object({
    tipo: z.literal(Perfil.MOTORISTA),
    nome: nomePessoaSchema,
    cpf: cpfSchema,
    telefone: telefoneSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: confirmarSenhaSchema,
    tipoVeiculoId: idCatalogoSchema,
    tipoCarroceriaId: idCatalogoSchema,
    placa: placaSchema,
    capacidadeKg: capacidadeKgSchema,
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
export type CadastroMotoristaForm = z.infer<typeof cadastroMotoristaSchema>

// ===== Cargas (empresa) =====

export const novaCargaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(4, 'O título deve ter no mínimo 4 caracteres')
    .max(128, 'O título deve ter no máximo 128 caracteres'),
  origem: z
    .string()
    .trim()
    .min(2, 'Informe a origem (Cidade/UF)')
    .max(128, 'A origem deve ter no máximo 128 caracteres'),
  destino: z
    .string()
    .trim()
    .min(2, 'Informe o destino (Cidade/UF)')
    .max(128, 'O destino deve ter no máximo 128 caracteres'),
  tipoVeiculoId: idCatalogoSchema,
  tipoCarroceriaId: idCatalogoSchema,
  pesoKg: z.coerce
    .number({ message: 'Peso inválido' })
    .int('O peso deve ser um número inteiro')
    .positive('O peso deve ser maior que zero')
    .optional(),
  volumeM3: z.coerce
    .number({ message: 'Volume inválido' })
    .positive('O volume deve ser maior que zero')
    .optional(),
  valorFrete: z.coerce
    .number({ message: 'Informe o valor do frete' })
    .positive('O valor do frete deve ser maior que zero'),
  dataColeta: z.string().optional(),
  descricao: z
    .string()
    .trim()
    .min(4, 'Descreva a carga (mínimo 4 caracteres)')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres'),
})
export type NovaCargaForm = z.infer<typeof novaCargaSchema>

// ===== Atualização de perfil =====

export const atualizarEmpresaSchema = z.object({
  razaoSocial: z
    .string()
    .trim()
    .min(2, 'Informe a razão social')
    .max(128, 'A razão social deve ter no máximo 128 caracteres'),
  nomeFantasia: z
    .string()
    .trim()
    .min(2, 'Informe o nome fantasia')
    .max(128, 'O nome fantasia deve ter no máximo 128 caracteres'),
  telefone: telefoneSchema,
  whatsapp: telefoneOpcionalSchema,
})
export type AtualizarEmpresaForm = z.infer<typeof atualizarEmpresaSchema>

export const atualizarMotoristaSchema = z.object({
  nome: nomePessoaSchema,
  telefone: telefoneSchema,
  cidade: z
    .string()
    .trim()
    .max(128, 'A cidade deve ter no máximo 128 caracteres')
    .optional(),
  tipoVeiculoId: idCatalogoSchema,
  tipoCarroceriaId: idCatalogoSchema,
  placa: placaSchema,
  capacidadeKg: capacidadeKgSchema,
})
export type AtualizarMotoristaForm = z.infer<typeof atualizarMotoristaSchema>

// ===== Admin · gestão de usuários =====

/** Criação de usuário pelo admin (apenas Administrador; perfil fixado no envio). */
export const adminCriarUsuarioSchema = z
  .object({
    nome: nomePessoaSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: confirmarSenhaSchema,
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })
export type AdminCriarUsuarioForm = z.infer<typeof adminCriarUsuarioSchema>

/** Edição de usuário pelo admin: nome e e-mail (perfil é read-only). */
export const adminEditarUsuarioSchema = z.object({
  nome: nomePessoaSchema,
  email: emailSchema,
})
export type AdminEditarUsuarioForm = z.infer<typeof adminEditarUsuarioSchema>

// ===== Avaliação (empresa avalia motorista) =====

export const avaliarMotoristaSchema = z.object({
  nota: z.coerce
    .number({ message: 'Informe a nota' })
    .int('A nota deve ser um número inteiro')
    .min(1, 'A nota mínima é 1')
    .max(5, 'A nota máxima é 5'),
  comentario: z
    .string()
    .trim()
    .max(500, 'O comentário deve ter no máximo 500 caracteres')
    .optional(),
})
export type AvaliarMotoristaForm = z.infer<typeof avaliarMotoristaSchema>
