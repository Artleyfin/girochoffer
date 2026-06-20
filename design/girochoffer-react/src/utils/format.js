import { statusColors } from './theme.js';

/* Formata um número em moeda brasileira. */
export const fmt = (n) =>
  'R$ ' +
  Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Status "efetivo" de exibição: uma carga disponível com interessados
   aparece como "Com interessados". */
export const dispStatus = (c) =>
  c.status === 'Disponível' && c.interessados.length > 0
    ? 'Com interessados'
    : c.status;

/* Estilo inline para o badge de status. */
export const statusStyle = (label) => {
  const c = statusColors[label] || ['#5A6573', '#EDF0F4'];
  return {
    color: c[0],
    background: c[1],
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'inline-block',
    whiteSpace: 'nowrap',
  };
};
