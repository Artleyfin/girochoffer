import { fmt, dispStatus } from './format.js';

/* Monta os campos derivados de uma carga para exibição. */
export function cargaVM(c, motoristas) {
  const statusLabel = dispStatus(c);
  const n = c.interessados.length;
  let interessadosLabel;
  if (c.escolhido && motoristas[c.escolhido]) {
    interessadosLabel = 'Motorista: ' + motoristas[c.escolhido].nome;
  } else if (n === 0) {
    interessadosLabel = 'Sem interessados ainda';
  } else {
    interessadosLabel = n + (n > 1 ? ' motoristas interessados' : ' motorista interessado');
  }
  return {
    ...c,
    statusLabel,
    valorFmt: fmt(c.valor),
    interessadosLabel,
  };
}
