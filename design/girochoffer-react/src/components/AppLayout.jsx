import { Outlet } from 'react-router';
import Header from './Header.jsx';
import { colors, fonts } from '../utils/theme.js';

/* Casca da área autenticada: header fixo + conteúdo da rota. */
export default function AppLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: fonts.body,
        color: colors.text,
      }}
    >
      <Header />
      <Outlet />
    </div>
  );
}
