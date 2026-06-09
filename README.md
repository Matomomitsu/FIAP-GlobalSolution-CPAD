# Global Solution CPAD
### Global Solution 2026.1 - Cross-Platform Application Development | FIAP

![Global Solution CPAD](./assets/images/icon.png)

## Descricao

Global Solution CPAD e um aplicativo mobile em React Native + Expo para simular uma plataforma de Space Predictive Analytics. A solucao monitora telemetria de sensores, energia, comunicacao, estabilidade orbital e asteroides proximos, gera alertas por limiares criticos e apresenta uma interpretacao operacional para apoio a decisao. O diferencial do projeto e unir dashboards em tempo real simulado, Context API, persistencia local, NASA Asteroids NeoWs e resumo manual com Groq.

## Equipe

| Nome | RM |
|------|----|
| Mateus Scandiuzzi Valente Tomomitsu | RM561565 |

## Telas do Aplicativo

### Login - Acesso do Operador
![Login](./assets/screenshots/tela_login.png)

Tela de entrada com credenciais locais para carregar as missoes do operador.

### Cadastro - Novo Operador
![Cadastro](./assets/screenshots/tela_cadastro.png)

Formulario de criacao de operador com nome, email, senha e feedback visual de validacao.

### Home - Dashboard Principal
![Home](./assets/screenshots/tela_inicial.png)

Visao geral dos indicadores da missao: energia, temperatura, sinal, estabilidade orbital, risco, interpretacao inteligente e monitoramento de asteroides.

### Analise de Bordo
![Analise de Bordo](./assets/screenshots/Analise_de_bordo.png)

Resumo operacional gerado sob demanda, com predicoes de curto prazo para apoio a decisao.

### Consciencia Orbital
![Consciencia Orbital](./assets/screenshots/Consciencia_Orbital.png)

Painel com objetos proximos a Terra e contexto externo de risco orbital.

### Dashboards - Dados Espaciais
![Dashboards](./assets/screenshots/Dashboards.png)

Dashboards com graficos e indicadores de sensores, energia, comunicacao e estabilidade orbital em tempo real simulado.

### Alertas
![Alertas](./assets/screenshots/Alertas.png)

Lista de alertas ativos e historico paginado de 5 em 5 registros, com filtro por status e acao para resolver registros inativos.

### Dados da Missao
![Dados da Missao](./assets/screenshots/Dados_Missao.png)

Tela central de configuracoes com operador, missao atual, lista de missoes e atalhos para criacao ou edicao.

### Editar Missao - Formulario
![Editar Missao](./assets/screenshots/Editar_Missao.png)

Tela separada para criar ou editar missao com nome, orbita, tripulacao, objetivo e limites de alerta com validacao.

## Funcionalidades

- [x] Navegacao com Expo Router usando Tabs
- [x] Dashboard principal com indicadores em tempo real simulado
- [x] Minimo de 3 dashboards: sensores, energia, comunicacao/orbita
- [x] Context API para estado global da missao
- [x] `useReducer`, `useState` e `useEffect` aplicados no fluxo principal
- [x] Login e cadastro local com validacao de nome, email e senha
- [x] Senhas protegidas por hash com `expo-crypto`
- [x] Persistencia com AsyncStorage para usuarios, missoes, limiares e historico
- [x] Multiplas missoes por usuario, com missao padrao criada automaticamente
- [x] Formulario funcional em tela separada para criar/editar missao com inputs controlados e validacao
- [x] Sistema de alertas automaticos baseado em limiares criticos
- [x] Historico dos alertas inativos ou resolvidos com filtro por status, paginacao de 5 registros e resolucao manual de inativos
- [x] Interface tematica espacial com modo escuro
- [x] Animacao continua com Animated API no fundo espacial
- [x] API externa com NASA Asteroids NeoWs e cache local diario
- [x] Integracao opcional com Groq API para resumo manual da missao
- [x] Prints reais de todas as telas em `assets/screenshots/`
- [ ] Video de demonstracao de ate 3 minutos

## Bonus Implementados

| Diferencial | Status | Implementacao |
|-------------|--------|---------------|
| TypeScript | Implementado | Tipagem consistente em telas, contexto, componentes e modelos da missao |
| Animacoes | Implementado | `Animated` API em `components/AnimatedStarfield.tsx` com pulso orbital continuo |
| API externa | Implementado | NASA Asteroids NeoWs em `components/AsteroidMonitorPanel.tsx` com cache local diario via AsyncStorage |
| Autenticacao local | Implementado | Cadastro/login com senha hasheada por `expo-crypto` e sessao persistida no dispositivo |
| Missoes por usuario | Implementado | Cada usuario tem missao padrao, pode criar novas missoes e remover missoes com seus alertas |
| Alertas inteligentes | Implementado | Regras de limiar classificam alertas criticos e o historico visivel nao duplica eventos ativos |
| IA Generativa | Implementado opcional | Botao de resumo da missao com Groq via `GROQ_API_KEY`, usando telemetria atual, alertas ativos e historico sem eventos abertos duplicados |
| Dark Mode | Implementado | Tema escuro espacial fixo em `app.json` e paleta visual propria |

## Tecnologias

- React Native + Expo SDK 56
- TypeScript
- Expo Router
- Context API
- AsyncStorage
- Expo Crypto
- Expo Symbols
- NASA Asteroids NeoWs
- Groq API
- Animated API
- React Native Reanimated

## Variaveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example` para configurar as APIs externas:

```bash
NASA_API_KEY=sua-chave-nasa
GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=llama-3.1-8b-instant
```

`NASA_API_KEY` e usada para carregar a janela de asteroides proximos pela NASA Asteroids NeoWs. O resultado fica salvo em cache local diario para evitar requisicoes repetidas.

O app funciona sem chave Groq usando um resumo local explicavel sob demanda. Para ativar a chamada real ao Groq, configure `GROQ_API_KEY`.

O modelo padrao `llama-3.1-8b-instant` e leve e adequado para uso no free tier da Groq, respeitando os limites da conta.

Nao envie o `.env` para o GitHub.

## Como Executar

### Pre-requisitos

- Node.js compativel com Expo SDK 56
- Expo Go instalado no celular ou ambiente de simulador

### Instalacao

Clone o repositorio:

```bash
git clone https://github.com/seu-usuario/seu-repo.git
```

Acesse a pasta do projeto:

```bash
cd space-predictive-analytics
```

Instale as dependencias:

```bash
npm install
```

Inicie o projeto:

```bash
npm start
```

Para validar os tipos TypeScript:

```bash
npm run typecheck
```

Escaneie o QR Code com o Expo Go para rodar no dispositivo fisico.

## Video de Demonstracao

[Clique aqui para assistir a demonstracao](https://youtube.com/...)

## Licenca

Este projeto foi desenvolvido para fins academicos - FIAP 2026.
