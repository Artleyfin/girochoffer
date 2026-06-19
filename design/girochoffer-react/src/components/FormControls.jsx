import { colors, selectArrow } from '../utils/theme.js';

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: colors.text,
  marginBottom: '6px',
};

const controlStyle = {
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${colors.borderInput}`,
  borderRadius: '10px',
  fontSize: '14px',
  background: '#fff',
};

/* Campo de texto rotulado. */
export function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ label, style, ...props }) {
  return (
    <Field label={label}>
      <input style={{ ...controlStyle, ...style }} {...props} />
    </Field>
  );
}

export function SelectInput({ label, children, style, ...props }) {
  return (
    <Field label={label}>
      <select style={{ ...controlStyle, ...selectArrow, ...style }} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, style, ...props }) {
  return (
    <Field label={label}>
      <textarea
        style={{ ...controlStyle, resize: 'vertical', fontFamily: 'inherit', ...style }}
        {...props}
      />
    </Field>
  );
}

export { controlStyle, labelStyle };
