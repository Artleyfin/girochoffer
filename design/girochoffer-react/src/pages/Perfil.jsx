import { useApp } from '../context/AppContext.jsx';
import { TextInput } from '../components/FormControls.jsx';
import Button from '../components/Button.jsx';
import { colors, fonts } from '../utils/theme.js';

function Cartao({ titulo, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '30px' }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: '18px', color: colors.inkStrong, marginBottom: '20px' }}>{titulo}</div>
      {children}
    </div>
  );
}

export default function Perfil() {
  const { role, usuarios, showToast } = useApp();
  const isEmpresa = role === 'empresa';
  const emp = usuarios.empresa;
  const mot = usuarios.motorista;

  const salvar = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button onClick={() => showToast('Alterações salvas com sucesso.')} style={{ padding: '13px 28px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
        Salvar alterações
      </Button>
    </div>
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, margin: '0 0 4px' }}>Meu perfil</h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>Edite seus dados cadastrais.</p>

      {isEmpresa ? (
        <Cartao titulo="Dados da empresa">
          <div style={{ marginBottom: '16px' }}>
            <TextInput label="Razão social" defaultValue={emp.razaoSocial} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <TextInput label="Nome fantasia" defaultValue={emp.nomeFantasia} />
            <TextInput label="CNPJ" defaultValue={emp.cnpj} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <TextInput label="Telefone" defaultValue={emp.telefone} />
            <TextInput label="E-mail" defaultValue={emp.email} />
          </div>
          {salvar}
        </Cartao>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Cartao titulo="Dados pessoais">
            <div style={{ marginBottom: '16px' }}>
              <TextInput label="Nome completo" defaultValue={mot.nome} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput label="Telefone" defaultValue={mot.telefone} />
              <TextInput label="E-mail" defaultValue={mot.email} />
            </div>
          </Cartao>
          <Cartao titulo="Meu veículo">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <TextInput label="Tipo de veículo" defaultValue={mot.tipoVeiculo} />
              <TextInput label="Carroceria" defaultValue={mot.carroceria} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput label="Capacidade" defaultValue={mot.capacidade} />
              <TextInput label="Placa" defaultValue={mot.placa} />
            </div>
          </Cartao>
          {salvar}
        </div>
      )}
    </div>
  );
}
