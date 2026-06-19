import { createContext, useContext, useState, useCallback, useRef } from 'react';
import cargasSeed from '../data/cargas.json';
import motoristasData from '../data/motoristas.json';
import opcoesData from '../data/opcoes.json';
import usuarios from '../data/usuarios.json';

const AppContext = createContext(null);

/* Usuário "logado" para fins do MVP. O motorista atual é sempre m1. */
const CURRENT_MOTORISTA = 'm1';

export function AppProvider({ children }) {
  const [role, setRole] = useState(null); // 'empresa' | 'motorista' | null
  const [cargas, setCargas] = useState(cargasSeed);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  /* ----- Ações sobre cargas ----- */
  const interesse = useCallback(
    (id) => {
      setCargas((cs) =>
        cs.map((c) =>
          c.id === id && !c.interessados.includes(CURRENT_MOTORISTA)
            ? { ...c, interessados: [...c.interessados, CURRENT_MOTORISTA] }
            : c
        )
      );
      showToast('Interesse enviado! O contato da empresa foi liberado.');
    },
    [showToast]
  );

  const escolher = useCallback(
    (id, mid) => {
      setCargas((cs) =>
        cs.map((c) =>
          c.id === id ? { ...c, escolhido: mid, status: 'Contratada' } : c
        )
      );
      const nome = motoristasData[mid] ? motoristasData[mid].nome : '';
      showToast(`${nome} foi contratado para o frete.`);
    },
    [showToast]
  );

  const concluir = useCallback(
    (id) => {
      setCargas((cs) =>
        cs.map((c) => (c.id === id ? { ...c, status: 'Concluída' } : c))
      );
      showToast('Frete marcado como concluído.');
    },
    [showToast]
  );

  const cancelarCarga = useCallback(
    (id) => {
      setCargas((cs) =>
        cs.map((c) => (c.id === id ? { ...c, status: 'Cancelada' } : c))
      );
      showToast('Carga cancelada.');
    },
    [showToast]
  );

  const publicar = useCallback(
    (nc) => {
      if (!nc.titulo || !nc.origem || !nc.destino) {
        showToast('Preencha ao menos título, origem e destino.');
        return false;
      }
      const carga = {
        id: 'n' + Date.now(),
        titulo: nc.titulo,
        empresa: usuarios.empresa.nome,
        empresaId: usuarios.empresa.id,
        mine: true,
        origem: nc.origem,
        destino: nc.destino,
        tipoVeiculo: nc.tipoVeiculo,
        carroceria: nc.carroceria,
        peso: nc.peso || '—',
        volume: '—',
        valor: Number(String(nc.valor).replace(/[^0-9]/g, '')) || 0,
        dataColeta: nc.dataColeta || 'A definir',
        descricao: nc.descricao || '—',
        status: 'Disponível',
        interessados: [],
        escolhido: null,
      };
      setCargas((cs) => [carga, ...cs]);
      showToast('Carga publicada com sucesso.');
      return true;
    },
    [showToast]
  );

  const value = {
    role,
    setRole,
    cargas,
    motoristas: motoristasData,
    opcoes: opcoesData,
    usuarios,
    currentMotorista: CURRENT_MOTORISTA,
    toast,
    showToast,
    interesse,
    escolher,
    concluir,
    cancelarCarga,
    publicar,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}
