import { statusStyle } from '../utils/format.js';

/* Pílula de status reutilizável. */
export default function StatusBadge({ label }) {
  return <span style={statusStyle(label)}>{label}</span>;
}
