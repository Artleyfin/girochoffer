import { colors } from '../utils/theme.js';

/* Estado vazio padrão (caixa tracejada com mensagem). */
export default function EmptyState({ children, padding = '48px', radius = '14px' }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px dashed ${colors.borderInput}`,
        borderRadius: radius,
        padding,
        textAlign: 'center',
        color: colors.muted2,
        fontSize: '14px',
      }}
    >
      {children}
    </div>
  );
}
