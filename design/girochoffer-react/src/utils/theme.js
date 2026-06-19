/* Paleta e tokens visuais do GiroChoffer, extraídos do protótipo original. */
export const colors = {
  bg: '#F4F6F9',
  surface: '#fff',
  text: '#39414E',
  ink: '#15191F',
  inkStrong: '#0B1B2B',
  primary: '#1284D7',
  primaryHover: '#0E6CB0',
  navy: '#0B3A66',
  navyHover: '#0a3158',
  navyDeep: '#0B1B2B',
  muted: '#6C7682',
  muted2: '#9AA3AF',
  muted3: '#5A6573',
  border: '#E5E9EF',
  borderInput: '#D9DEE6',
  borderSoft: '#E0E6ED',
  tintBlue: '#E7F2FB',
  tintBlueText: '#0E6CB0',
};

export const fonts = {
  heading: "'Archivo', system-ui, sans-serif",
  body: "'Public Sans', system-ui, sans-serif",
};

/* Mapa de cores por status, usado nos badges. [texto, fundo] */
export const statusColors = {
  Disponível: ['#0E6CB0', '#E7F2FB'],
  'Com interessados': ['#B7791F', '#FBF1E0'],
  Contratada: ['#1E8E5A', '#E3F4EC'],
  Concluída: ['#5A6573', '#EDF0F4'],
  Cancelada: ['#C0392B', '#FBEAE8'],
};

/* Estilo de seta customizada para <select>: remove a seta nativa (que fica
   colada na borda) e desenha um chevron com espaçamento confortável. */
export const selectArrow = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236C7682' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '40px',
};
