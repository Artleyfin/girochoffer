import { useApp } from '../context/AppContext.jsx';

/* Notificação flutuante (toast) global. */
export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#0B1B2B',
        color: '#fff',
        padding: '14px 24px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 8px 30px rgba(11,27,43,.32)',
        zIndex: 100,
        animation: 'gc_toast .25s ease',
        maxWidth: '90vw',
      }}
    >
      {toast}
    </div>
  );
}
