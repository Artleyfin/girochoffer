import { Routes, Route, Navigate } from 'react-router';
import { useApp } from './context/AppContext.jsx';
import Toast from './components/Toast.jsx';
import AppLayout from './components/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import RecuperarSenha from './pages/RecuperarSenha.jsx';
import EmpresaPainel from './pages/EmpresaPainel.jsx';
import EmpresaNovaCarga from './pages/EmpresaNovaCarga.jsx';
import EmpresaDetalhes from './pages/EmpresaDetalhes.jsx';
import MotoristaPainel from './pages/MotoristaPainel.jsx';
import MotoristaDetalhes from './pages/MotoristaDetalhes.jsx';
import MotoristaMinhas from './pages/MotoristaMinhas.jsx';
import Perfil from './pages/Perfil.jsx';

/* Protege rotas que exigem um papel específico. Sem papel ativo,
   redireciona para a tela de login. */
function Require({ role, children }) {
  const { role: active } = useApp();
  if (!active) return <Navigate to="/entrar" replace />;
  if (role && active !== role) {
    return <Navigate to={active === 'empresa' ? '/empresa' : '/motorista'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Auth />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Área autenticada (com header) */}
        <Route element={<AppLayout />}>
          <Route
            path="/empresa"
            element={
              <Require role="empresa">
                <EmpresaPainel />
              </Require>
            }
          />
          <Route
            path="/empresa/nova"
            element={
              <Require role="empresa">
                <EmpresaNovaCarga />
              </Require>
            }
          />
          <Route
            path="/empresa/carga/:id"
            element={
              <Require role="empresa">
                <EmpresaDetalhes />
              </Require>
            }
          />
          <Route
            path="/motorista"
            element={
              <Require role="motorista">
                <MotoristaPainel />
              </Require>
            }
          />
          <Route
            path="/motorista/carga/:id"
            element={
              <Require role="motorista">
                <MotoristaDetalhes />
              </Require>
            }
          />
          <Route
            path="/motorista/minhas"
            element={
              <Require role="motorista">
                <MotoristaMinhas />
              </Require>
            }
          />
          <Route
            path="/perfil"
            element={
              <Require>
                <Perfil />
              </Require>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
