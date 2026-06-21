import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { colors, selectArrow } from '@/lib/theme'

/* Controles de formulário no estilo do design (estilos inline, sem Bootstrap).
   Portado de design/girochoffer-react/src/components/FormControls.jsx. */

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: colors.text,
  marginBottom: '6px',
}

export const controlStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${colors.borderInput}`,
  borderRadius: '10px',
  fontSize: '14px',
  background: '#fff',
}

/* Campo rotulado genérico. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  style?: CSSProperties
}

export function TextInput({ label, style, ...props }: TextInputProps) {
  return (
    <Field label={label}>
      <input style={{ ...controlStyle, ...style }} {...props} />
    </Field>
  )
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  style?: CSSProperties
  children?: ReactNode
}

export function SelectInput({ label, children, style, ...props }: SelectInputProps) {
  return (
    <Field label={label}>
      <select style={{ ...controlStyle, ...selectArrow, ...style }} {...props}>
        {children}
      </select>
    </Field>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  style?: CSSProperties
}

export function TextArea({ label, style, ...props }: TextAreaProps) {
  return (
    <Field label={label}>
      <textarea
        style={{ ...controlStyle, resize: 'vertical', fontFamily: 'inherit', ...style }}
        {...props}
      />
    </Field>
  )
}
