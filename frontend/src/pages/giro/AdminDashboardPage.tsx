import type { CSSProperties, ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import type { AdminDashboard } from '@/lib/types'
import { useFetch } from '@/hooks/useFetch'
import Spinner from '@/components/ui/Spinner'
import { colors, fonts, statusColors } from '@/lib/theme'

/* Home do admin: 4 cards + barras (cargas por status) + rosca (usuários por
   perfil) + linha (cadastros por mês). Dados de GET /api/admin/dashboard. */

const CORES_PERFIL: Record<string, string> = {
  Administrador: colors.navy,
  Empresa: colors.primary,
  Motorista: '#1E8E5A',
}

function corStatus(rotulo: string): string {
  const par = statusColors[rotulo as keyof typeof statusColors]
  return par ? par[0] : colors.primary
}

function StatCard({ label, valor, icone, cor }: { label: string; valor: number; icone: string; cor: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: cor + '1A',
          color: cor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flex: 'none',
        }}
      >
        {icone}
      </div>
      <div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 26, color: colors.inkStrong, lineHeight: 1 }}>
          {valor}
        </div>
        <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 22 }}>
      <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 16, color: colors.ink, margin: '0 0 18px' }}>
        {titulo}
      </h2>
      {children}
    </div>
  )
}

const tooltipStyle: CSSProperties = {
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 13,
}

export default function AdminDashboardPage() {
  const { data, carregando, erro } = useFetch<AdminDashboard>(
    (signal) => api.get<AdminDashboard>('/admin/dashboard', { signal }),
    [],
  )

  return (
    <div style={{ padding: '32px 36px 56px', maxWidth: 1100 }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 28, color: colors.inkStrong, margin: '0 0 4px' }}>
        Painel administrativo
      </h1>
      <p style={{ color: colors.muted, margin: '0 0 26px' }}>Visão geral da plataforma GiroChoffer.</p>

      {carregando && <Spinner texto="Carregando estatísticas..." />}
      {erro && <p style={{ color: '#C0392B' }}>Erro ao carregar o dashboard.</p>}

      {data && (
        <>
          {/* Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 22,
            }}
          >
            <StatCard label="Usuários" valor={data.total_usuarios} icone="👤" cor={colors.navy} />
            <StatCard label="Empresas" valor={data.total_empresas} icone="🏢" cor={colors.primary} />
            <StatCard label="Motoristas" valor={data.total_motoristas} icone="🚚" cor="#1E8E5A" />
            <StatCard label="Cargas" valor={data.total_cargas} icone="📦" cor="#B7791F" />
          </div>

          {/* Gráficos: barras + rosca */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
            <Painel titulo="Cargas por status">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.cargas_por_status} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: colors.muted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: colors.muted }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: colors.bg }} />
                  <Bar dataKey="total" name="Cargas" radius={[6, 6, 0, 0]}>
                    {data.cargas_por_status.map((c) => (
                      <Cell key={c.rotulo} fill={corStatus(c.rotulo)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Painel>

            <Painel titulo="Usuários por perfil">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.usuarios_por_perfil}
                    dataKey="total"
                    nameKey="rotulo"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {data.usuarios_por_perfil.map((p) => (
                      <Cell key={p.rotulo} fill={CORES_PERFIL[p.rotulo] ?? colors.muted} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </Painel>
          </div>

          {/* Linha: cadastros por mês */}
          <Painel titulo="Cadastros por mês (últimos 6 meses)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.cadastros_por_mes} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: colors.muted }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: colors.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Cadastros"
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: colors.primary }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Painel>
        </>
      )}
    </div>
  )
}
