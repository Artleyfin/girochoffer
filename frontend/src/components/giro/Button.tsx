import { useState } from 'react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

/* Botão com suporte a estilo de hover (já que usamos estilos inline).
   Passe `style` para o estado normal e `hoverStyle` para o hover.
   Portado de design/girochoffer-react/src/components/Button.jsx. */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  style?: CSSProperties
  hoverStyle?: CSSProperties
  children?: ReactNode
}

export default function Button({ style, hoverStyle, children, ...props }: ButtonProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      {...props}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...style, ...(hover ? hoverStyle : null) }}
    >
      {children}
    </button>
  )
}
