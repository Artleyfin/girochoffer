import type { CSSProperties } from 'react'
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { colors } from '@/lib/theme'

// errorElement da rota raiz: isola crashes de render para que um erro em uma
// página não derrube o app inteiro (white screen). Espelha errors/500.html.
export default function RouteError() {
  const error = useRouteError()

  let titulo = 'Algo deu errado'
  let detalhe = 'Ocorreu um erro inesperado ao renderizar esta página.'

  if (isRouteErrorResponse(error)) {
    titulo = `${error.status} ${error.statusText}`
    detalhe = typeof error.data === 'string' ? error.data : detalhe
  } else if (error instanceof Error) {
    detalhe = error.message
  }

  return (
    <div style={wrap}>
      <div style={box}>
        <svg width="56" height="56" viewBox="0 0 16 16" fill="none" stroke="#C0392B" strokeWidth="1.1" aria-hidden="true">
          <path d="M7.938 2.016a.13.13 0 0 0-.16.026.1.1 0 0 0-.026.043L1.756 13.4a.1.1 0 0 0 .043.137c.014.006.03.01.043.01h12.316a.1.1 0 0 0 .093-.137L8.157 2.085a.1.1 0 0 0-.219-.069z" strokeLinejoin="round" />
          <path d="M8 6v3.5M8 11.5h.01" strokeLinecap="round" />
        </svg>
        <h2 style={h2}>{titulo}</h2>
        <p style={msg}>{detalhe}</p>
        <div style={acoes}>
          <Link to="/" style={btnPrimario}>
            <IconeCasa /> Início
          </Link>
          <button style={btnSecundario} onClick={() => window.location.reload()}>
            <IconeRecarregar /> Recarregar
          </button>
        </div>
      </div>
    </div>
  )
}

function IconeCasa() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 .5 1 6v9h4.5v-4.5h5V15H15V6L8 .5zM8 2.2 13.5 6.5V13.5h-1.5V9h-8v4.5H2.5V6.5L8 2.2z" />
    </svg>
  )
}

function IconeRecarregar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.5 2v3h-3" />
    </svg>
  )
}

const wrap: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}
const box: CSSProperties = {
  textAlign: 'center',
  maxWidth: 420,
}
const h2: CSSProperties = {
  margin: '16px 0 8px',
  color: colors.ink,
  fontSize: 24,
}
const msg: CSSProperties = {
  margin: '0 0 24px',
  color: colors.muted,
  fontSize: 15,
}
const acoes: CSSProperties = {
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
}
const btnBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
}
const btnPrimario: CSSProperties = {
  ...btnBase,
  background: colors.primary,
  color: '#fff',
  border: `1px solid ${colors.primary}`,
}
const btnSecundario: CSSProperties = {
  ...btnBase,
  background: '#fff',
  color: colors.muted3,
  border: `1px solid ${colors.borderInput}`,
}
