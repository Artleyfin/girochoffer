# GiroChoffer — MVP (React)

Marketplace de fretes que conecta **empresas** (que precisam transportar cargas) a
**motoristas** (que buscam fretes). Conversão do protótipo HTML para um projeto
React real, componentizado, navegável e com dados fictícios em JSON.

## Stack

- **React 19**
- **React Router 8** — importado de `react-router` (na v8 o pacote
  `react-router-dom` foi removido; tudo vem de `react-router`)
- **Vite 7** como bundler/dev server
- Estilização **inline** (mesma linguagem visual do protótipo original)

## Rodando localmente

```bash
cd girochoffer-react
npm install
npm run dev      # servidor de desenvolvimento (Vite)
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Estrutura

```
src/
  main.jsx              Ponto de entrada (createRoot + BrowserRouter + AppProvider)
  App.jsx               Definição de rotas e guarda de papel (<Require>)
  index.css             Reset e estilos globais mínimos + keyframes do toast

  context/
    AppContext.jsx      Estado global: papel ativo, cargas, ações e toasts

  data/                 Fonte de dados fictícia (JSON)
    cargas.json         Cargas/fretes
    motoristas.json     Motoristas interessados
    usuarios.json       Empresa e motorista "logados"
    opcoes.json         Listas de carrocerias e tipos de veículo

  components/           Componentes reutilizáveis
    AppLayout.jsx       Casca autenticada (header + <Outlet/>)
    Header.jsx          Cabeçalho com navegação por papel
    Button.jsx          Botão com estado de hover (estilos inline)
    FormControls.jsx    Campos de formulário rotulados
    StatusBadge.jsx     Pílula de status
    CargaCardEmpresa.jsx / CargaCardMercado.jsx / CargaResumoRow.jsx
    CargaDetalheCard.jsx / MotoristaInteressadoCard.jsx / EmptyState.jsx
    Toast.jsx           Notificação flutuante

  pages/                Telas (uma por rota)
    Landing.jsx         Página pública de apresentação
    Auth.jsx            Login / cadastro (empresa ou motorista)
    EmpresaPainel.jsx EmpresaNovaCarga.jsx EmpresaDetalhes.jsx
    MotoristaPainel.jsx MotoristaDetalhes.jsx MotoristaMinhas.jsx
    Perfil.jsx          Perfil (empresa ou motorista)

  utils/
    theme.js            Cores e fontes (tokens do protótipo)
    format.js           Formatação de moeda e status
    cargaVm.js          Campos derivados de uma carga para exibição
```

## Rotas

| Rota                     | Tela                         | Papel      |
|--------------------------|------------------------------|------------|
| `/`                      | Landing pública              | —          |
| `/entrar`                | Login / cadastro             | —          |
| `/empresa`               | Painel da empresa            | empresa    |
| `/empresa/nova`          | Publicar nova carga          | empresa    |
| `/empresa/carga/:id`     | Detalhes + interessados      | empresa    |
| `/motorista`             | Cargas disponíveis (vitrine) | motorista  |
| `/motorista/carga/:id`   | Detalhes da carga            | motorista  |
| `/motorista/minhas`      | Minhas cargas                | motorista  |
| `/perfil`                | Meu perfil                   | ambos      |

O estado é mantido em memória (React state) — recarregar a página reinicia os
dados a partir dos JSON em `src/data/`.

## Preview rápido

O arquivo `preview-girochoffer-react.html` (na raiz do projeto, fora de
`girochoffer-react/`) é uma versão de visualização do app completo em um único
HTML — usa React 19 e React Router 8 carregados como ESM e o Babel para
transpilar o JSX no navegador. Serve só para inspeção rápida; a fonte de verdade
é o projeto Vite em `girochoffer-react/`.
