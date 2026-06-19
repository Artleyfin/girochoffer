import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import { TextInput, SelectInput, TextArea } from '../components/FormControls.jsx';
import Button from '../components/Button.jsx';
import { colors, fonts } from '../utils/theme.js';

const initial = {
  titulo: '',
  origem: '',
  destino: '',
  tipoVeiculo: 'Caminhão',
  carroceria: 'Baú',
  peso: '',
  valor: '',
  dataColeta: '',
  descricao: '',
};

export default function EmpresaNovaCarga() {
  const navigate = useNavigate();
  const { opcoes, publicar } = useApp();
  const [form, setForm] = useState(initial);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPublicar = () => {
    if (publicar(form)) navigate('/empresa');
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 32px 64px' }}>
      <button onClick={() => navigate('/empresa')} style={{ background: 'none', border: 'none', color: colors.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Voltar ao painel
      </button>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: '30px', color: colors.inkStrong, margin: '0 0 4px' }}>Publicar nova carga</h1>
      <p style={{ margin: '0 0 28px', color: colors.muted, fontSize: '15px' }}>
        Preencha os dados do frete. Ele ficará disponível para os motoristas imediatamente.
      </p>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '30px' }}>
        <div style={{ marginBottom: '18px' }}>
          <TextInput label="Título da carga" value={form.titulo} onChange={set('titulo')} placeholder="Ex.: Eletrodomésticos — linha branca" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <TextInput label="Origem" value={form.origem} onChange={set('origem')} placeholder="Cidade/UF" />
          <TextInput label="Destino" value={form.destino} onChange={set('destino')} placeholder="Cidade/UF" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <SelectInput label="Tipo de veículo" value={form.tipoVeiculo} onChange={set('tipoVeiculo')}>
            {opcoes.tiposVeiculo.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </SelectInput>
          <SelectInput label="Tipo de carroceria" value={form.carroceria} onChange={set('carroceria')}>
            {opcoes.carrocerias.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </SelectInput>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <TextInput label="Peso" value={form.peso} onChange={set('peso')} placeholder="Ex.: 8.500 kg" />
          <TextInput label="Valor do frete (R$)" value={form.valor} onChange={set('valor')} placeholder="Ex.: 4200" />
          <TextInput label="Data de coleta" value={form.dataColeta} onChange={set('dataColeta')} placeholder="dd/mm/aaaa" />
        </div>
        <div style={{ marginBottom: '26px' }}>
          <TextArea label="Descrição" rows={4} value={form.descricao} onChange={set('descricao')} placeholder="Detalhes da carga, exigências de manuseio, agendamento de descarga..." />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/empresa')} style={{ padding: '13px 24px', background: '#fff', color: colors.ink, border: `1px solid ${colors.borderInput}`, borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <Button onClick={onPublicar} style={{ padding: '13px 28px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }} hoverStyle={{ background: colors.primaryHover }}>
            Publicar carga
          </Button>
        </div>
      </div>
    </div>
  );
}
