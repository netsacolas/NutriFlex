# NutriMais AI - DocumentaÃ§Ã£o TÃ©cnica

## VisÃ£o Geral

**NutriMais AI** Ã© uma aplicaÃ§Ã£o web inteligente de diÃ¡rio alimentar que simplifica o planejamento nutricional. Os usuÃ¡rios definem suas metas de calorias para cada refeiÃ§Ã£o, escolhem os alimentos desejados, e a IA calcula automaticamente as porÃ§Ãµes ideais para atingir uma dieta balanceada com distribuiÃ§Ã£o de macronutrientes 40% carboidratos, 30% proteÃ­na e 30% gordura.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
- **Repository**: https://github.com/netsacolas/NutriMais.git
- **Repository Banner**: ![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## Stack TecnolÃ³gica

### Frontend
- **React 19.2.0** - Biblioteca UI com componentes funcionais e hooks
- **React Router DOM 7.9.4** - Camada de roteamento com rotas pÃºblicas e protegidas
- **TypeScript 5.8.2** - Type safety e desenvolvimento robusto
- **Vite 6.2.0** - Build tool e dev server de alta performance
- **TailwindCSS** - Consumo via CDN no `index.html` (dependÃªncia local 4.x jÃ¡ instalada para futura migraÃ§Ã£o)

### Bibliotecas
- **Recharts 3.3.0** - VisualizaÃ§Ã£o de dados (grÃ¡ficos de pizza para macronutrientes)
- **@google/genai 1.27.0** - SDK oficial do Google Gemini AI (Edge Function)
- **Zod 4.1.12** - Schemas de validaÃ§Ã£o centralizados em `utils/validation.ts`

### Backend & Infraestrutura
- **Supabase** - Backend as a Service (autenticaÃ§Ã£o, banco de dados PostgreSQL)
- **Gemini 2.0 Flash Experimental** - Modelo de IA para cÃ¡lculos nutricionais
- **AI Studio CDN** - Hosting de dependÃªncias via importmap

---

## Arquitetura do Projeto

```
NutriMais/
â”œâ”€â”€ index.html                  # Entry point HTML (Tailwind CDN; SW desabilitado em dev)
â”œâ”€â”€ index.tsx                   # Bootstrap do React
â”œâ”€â”€ App.tsx                     # Router + PWAManager
â”œâ”€â”€ AppSimple.tsx / TestApp.tsx # Variantes de depuraÃ§Ã£o
â”œâ”€â”€ types.ts                    # Tipagens compartilhadas
â”œâ”€â”€ vite.config.ts              # Vite + plugin de security headers + ajustes PWA
â”œâ”€â”€ tsconfig.json               # ConfiguraÃ§Ã£o TypeScript
â”œâ”€â”€ package.json                # DependÃªncias e scripts
â”œâ”€â”€ config/
â”‚   â””â”€â”€ app.config.ts           # Metadados, URLs e feature flags
â”œâ”€â”€ contexts/
â”‚   â””â”€â”€ AuthContext.tsx         # Provedor Supabase Auth
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ Auth/                   # Login, cadastro, recuperaÃ§Ã£o
â”‚   â”œâ”€â”€ Layout/                 # MainLayout, navbar, sidebar
â”‚   â”œâ”€â”€ UserPanel/              # Modais de perfil, saÃºde, histÃ³rico
â”‚   â”œâ”€â”€ MealPlanner.tsx         # Planejamento de refeiÃ§Ãµes
â”‚   â”œâ”€â”€ MealResult.tsx          # ExibiÃ§Ã£o e ediÃ§Ã£o das porÃ§Ãµes
â”‚   â”œâ”€â”€ AIAssistantFAB.tsx      # Acesso rÃ¡pido ao chat IA
â”‚   â”œâ”€â”€ PWAComponents.tsx       # InstallPrompt, OfflineDetector, UpdateNotification
â”‚   â””â”€â”€ Toast.tsx / ConfirmDeleteModal.tsx / icons.tsx
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ LandingPage.tsx         # Landing institucional
â”‚   â”œâ”€â”€ AuthPage.tsx            # Container de autenticaÃ§Ã£o
â”‚   â”œâ”€â”€ HomePage.tsx            # Dashboard pÃ³s-login
â”‚   â”œâ”€â”€ PlanMealPage.tsx        # Orquestra planner + resultados
â”‚   â”œâ”€â”€ HistoryPage.tsx         # HistÃ³ricos (refeiÃ§Ãµes, peso, atividades)
â”‚   â”œâ”€â”€ HealthPage.tsx          # Metas de saÃºde e atividades
â”‚   â”œâ”€â”€ ProfilePage.tsx         # Perfil, avatar e senha
â”‚   â””â”€â”€ ChatPage.tsx            # Chat nutricional com IA
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ geminiService.ts        # Chamada Ã  Edge Function + fallback direto
â”‚   â”œâ”€â”€ authService.ts          # Wrapper Supabase Auth
â”‚   â”œâ”€â”€ profileService.ts       # Perfil do usuÃ¡rio
â”‚   â”œâ”€â”€ mealHistoryService.ts   # HistÃ³rico de refeiÃ§Ãµes
â”‚   â”œâ”€â”€ weightHistoryService.ts # HistÃ³rico de peso
â”‚   â”œâ”€â”€ physicalActivityService.ts
â”‚   â”œâ”€â”€ costAnalysisService.ts  # Painel administrativo
â”‚   â””â”€â”€ nutritionChatService.ts # Prompt engineering do chat
â”œâ”€â”€ data/
â”‚   â””â”€â”€ activitiesDatabase.ts   # Banco local de atividades + MET
â”œâ”€â”€ utils/
â”‚   â”œâ”€â”€ backgroundSync.tsx      # Fila offline + badge
â”‚   â”œâ”€â”€ bmiUtils.ts             # CÃ¡lculo de IMC
â”‚   â”œâ”€â”€ logger.ts               # Logger seguro (silenciado em produÃ§Ã£o)
â”‚   â””â”€â”€ validation.ts           # Schemas Zod (a integrar nos formulÃ¡rios)
â”œâ”€â”€ email-templates/            # Templates de onboarding
â”œâ”€â”€ scripts/                    # Ferramentas PWA (validate, generate icons/splash)
â”œâ”€â”€ migrations/                 # SQL manuais + apply-all-migrations.sql
â””â”€â”€ supabase/
    â”œâ”€â”€ functions/gemini-proxy/ # Edge Function com rate limiting (20 req/h)
    â”œâ”€â”€ functions/gemini-generic/
    â”œâ”€â”€ migrations/             # MigraÃ§Ãµes Supabase CLI
    â””â”€â”€ functions/DEPLOY_INSTRUCTIONS.md
```

---
---

## Componentes Principais

### 1. App.tsx
[App.tsx](App.tsx)

**Responsabilidade**: Configurar o roteamento principal, prover contexto de autenticaÃ§Ã£o e inicializar recursos PWA.

**Principais peÃ§as**:
- `AuthProvider`: encapsula Supabase Auth e expÃµe `signIn`, `signUp`, `signOut`.
- `ProtectedRoute`: wrapper que redireciona visitantes nÃ£o autenticados para `/login`.
- `PWAManager` + `SyncStatusBadge`: componentes globais para instalar app, detectar offline e monitorar fila de sincronizaÃ§Ã£o.
- `initBackgroundSync()`: inicializa Service Worker, listeners de `online` e fila local (envelopado em `useEffect`).

**Rotas** (`BrowserRouter` + `Routes`):
- PÃºblicas: `/` (Landing), `/login`, `/register`.
- Protegidas: `/home`, `/plan`, `/history`, `/health`, `/profile`, `/chat`.
- Rota curinga redireciona para `/`.

**ObservaÃ§Ãµes**:
- HÃ¡ `console.log` de diagnÃ³stico no `useEffect` inicial (pendente migrar para `logger`).
- O carregamento protegido exibe spinner enquanto `AuthContext` resolve a sessÃ£o inicial.

---

### 2. MealPlanner.tsx
[components/MealPlanner.tsx](components/MealPlanner.tsx)

**Responsabilidade**: Interface para configuraÃ§Ã£o de refeiÃ§Ãµes.

**Funcionalidades**:

#### Gerenciamento de RefeiÃ§Ãµes
- **Tipos de refeiÃ§Ã£o**: CafÃ© da manhÃ£, AlmoÃ§o, Jantar, Lanche
- **Meta de calorias**: Input numÃ©rico configurÃ¡vel
- **Lista de alimentos**: Sistema de tags com adicionar/remover

#### Sistema de Favoritos
- PersistÃªncia em `localStorage`
- Toggle de favoritos por alimento (Ã­cone de estrela)
- Quick add de favoritos Ã  refeiÃ§Ã£o atual
- SincronizaÃ§Ã£o automÃ¡tica entre favoritos e selecionados

#### UX/UI
- ValidaÃ§Ã£o de duplicatas (case-insensitive)
- AnimaÃ§Ãµes fade-in para feedback visual
- BotÃ£o de cÃ¡lculo com estados loading/disabled
- Design responsivo (mobile-first)

**Estado Local**:
```typescript
mealType: MealType
targetCalories: number
currentFood: string
selectedFoods: string[]
favoriteFoods: string[] (localStorage synced)
```

---

### 3. MealResult.tsx
[components/MealResult.tsx](components/MealResult.tsx)

**Responsabilidade**: VisualizaÃ§Ã£o e ediÃ§Ã£o de resultados nutricionais.

**Features Principais**:

#### EdiÃ§Ã£o Interativa de PorÃ§Ãµes
- **Ajuste em tempo real**: Inputs numÃ©ricos para gramas de cada alimento
- **Estado separado para inputs**: `inputValues` Map permite campo vazio durante ediÃ§Ã£o
- **RecÃ¡lculo automÃ¡tico**:
  - CÃ¡lculos sempre baseados em valores originais (nÃ£o compostos)
  - Calorias proporcionais
  - Macros (proteÃ­na, carboidratos, gorduras, fibras)
  - Ãndice glicÃªmico ponderado
  - Carga glicÃªmica total
  - Totais da refeiÃ§Ã£o
- **ValidaÃ§Ã£o inteligente**:
  - Permite apagar completamente o valor durante ediÃ§Ã£o
  - Restaura valor automaticamente no onBlur se vazio
  - Aceita valor 0 para "remover" alimento temporariamente

**Algoritmo de RecÃ¡lculo**:
```typescript
// Sempre calcula do ORIGINAL, nÃ£o do editado
ratio = newGrams / originalPortion.grams
newCalories = originalPortion.calories * ratio
newMacro = originalPortion.macros * ratio

// Ãndice glicÃªmico ponderado pelos carboidratos
weightedGI = Î£(GI_alimento Ã— (carbs_alimento / total_carbs))

// Carga glicÃªmica
glycemicLoad = (weightedGI Ã— total_carbs) / 100
```

#### VisualizaÃ§Ã£o de Dados

**MacroChart Component**:
- GrÃ¡fico de pizza (donut chart) com Recharts
- ConversÃ£o de macros para calorias:
  - Carboidratos: 4 kcal/g
  - ProteÃ­nas: 4 kcal/g
  - Gorduras: 9 kcal/g
- **Total de calorias passado como prop** (evita erros de arredondamento)
- Tooltip customizado com tema dark
- Centro do donut mostra total exato de calorias
- Legendas com percentuais calculados dinamicamente

**Cards Informativos**:
- Grid responsivo de macronutrientes
- Fibras totais recalculadas proporcionalmente
- Ãndice glicÃªmico mÃ©dio ponderado
- Carga glicÃªmica atualizada

#### SugestÃµes da IA
- Lista de dicas nutricionais personalizadas geradas pelo Gemini
- Ãcones de check para melhor legibilidade
- Condicional (sÃ³ exibe se houver sugestÃµes)

---

### 4. geminiService.ts
[services/geminiService.ts](services/geminiService.ts)

**Responsabilidade**: Intermediar o cÃ¡lculo de porÃ§Ãµes via Edge Function `gemini-proxy` (Supabase) e acionar fallback direto apenas quando necessÃ¡rio.

#### Fluxo Atual
1. Recupera a sessÃ£o vigente (`supabase.auth.getSession()`).
2. Monta payload `{ mealType, targetCalories, foods }`.
3. Envia `fetch` para `${SUPABASE_URL}/functions/v1/gemini-proxy` com headers:
   - `Authorization: Bearer <JWT>` (usuÃ¡rio autenticado)
   - `apikey: VITE_SUPABASE_ANON_KEY`
   - `Content-Type: application/json`
4. Trata respostas: 401 (sessÃ£o expirada), 429 (rate limit 20/h), 500 (aciona fallback direto).
5. Valida a presenÃ§a de `data.portions` e retorna `MealResult`.

#### SeguranÃ§a
- Edge Function valida autenticaÃ§Ã£o, normaliza entrada e registra uso na tabela `gemini_requests` (rate limiting por usuÃ¡rio).
- Prompt e schema continuam garantindo distribuiÃ§Ã£o 40/30/30 e anÃ¡lise nutricional completa.
- Fallback `calculateMealPortionsDirect` ainda depende de `VITE_GEMINI_API_KEY`; remover apÃ³s armazenar segredo no Supabase Vault.

#### Tratamento de Erros
- Logger (`logger.info/debug/error`) registra etapas crÃ­ticas e falhas.
- Mensagens amigÃ¡veis para rate limit e sessÃ£o expirada.
- Em erro 500, tenta fallback; se tambÃ©m falhar, retorna mensagem genÃ©rica orientando tentar novamente.

#### ObservaÃ§Ãµes
- Response schema segue `MealResult` tipado em `types.ts` (calorias totais, macros, IG/CG, porÃ§Ãµes, sugestÃµes).
- Rate limiting efetivo exige migraÃ§Ã£o das migraÃ§Ãµes `005_add_gemini_requests_table.sql`/`007_add_email_to_gemini_requests.sql`.


---

## Sistema de UsuÃ¡rio e Backend (Supabase)

### 5. AutenticaÃ§Ã£o e Perfil de UsuÃ¡rio

**ServiÃ§os Backend**:
- [authService.ts](services/authService.ts) â€” Login, cadastro, logout, redefiniÃ§Ã£o de senha, resend confirmation.
- [profileService.ts](services/profileService.ts) â€” CRUD de perfil, metas calÃ³ricas, telefone e avatar.
- [supabaseClient.ts](services/supabaseClient.ts) â€” Cliente Supabase com logger seguro e persistÃªncia de sessÃ£o padrÃ£o (localStorage).

**Fluxos de AutenticaÃ§Ã£o**:
```typescript
await authService.signIn(email, password)      // Login email/senha
await authService.signUp(email, password)      // Cadastro (envia email de confirmaÃ§Ã£o se habilitado no painel)
await authService.signOut()                    // Logout
await authService.resetPassword(email)         // Envia link de redefiniÃ§Ã£o
await authService.updatePassword(newPassword)  // Altera senha logado
```
- `AuthContext` encapsula estado do usuÃ¡rio e expÃµe hooks (`useAuth`).
- `pages/AuthPage.tsx` oferece experiÃªncia unificada com tabs â€œEntrar/Cadastrarâ€ (senha mÃ­nima ainda 6 caracteres).
- Confirmar e-mail depende da configuraÃ§Ã£o no Supabase Dashboard (nÃ£o verificado via cÃ³digo).

**Perfil de UsuÃ¡rio (`types.ts`)**: estrutura ampliada para dados de saÃºde e preferÃªncias. Campos principais:
```typescript
interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  activity_level: 'sedentary' | 'lightly_active' | ... | null;
  meals_per_day: number | null;
  breakfast_calories: number | null;
  lunch_calories: number | null;
  dinner_calories: number | null;
  snack_calories: number | null;
  snack_quantity: number | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  health_goals: string[] | null;
  created_at: string;
  updated_at: string;
}
```

**Interface**:
- `pages/ProfilePage.tsx` â€” Tela dedicada com atualizaÃ§Ã£o de perfil, avatar e senha (ainda aceita senhas â‰¥6).
- `components/UserPanel/*` â€” Modais reutilizÃ¡veis quando o app era single-page; continuam disponÃ­veis para uso no dashboard.
- `pages/HealthPage.tsx` e `pages/HistoryPage.tsx` consomem `profileService`, `mealHistoryService`, `weightHistoryService` e `physicalActivityService` para consolidar informaÃ§Ãµes.

**PendÃªncias visÃ­veis**:
- ValidaÃ§Ãµes Zod ainda nÃ£o integradas aos formulÃ¡rios (`AuthPage`, `ProfilePage`, `HealthPage`).
- Tokens permanecem em `localStorage` via Supabase Auth (`persistSession: true`).
- Requisitos de senha fortes (â‰¥12 caracteres, complexidade) ainda nÃ£o aplicados apesar de existirem schemas em `utils/validation.ts`.

---

### 6. HealthModal - SaÃºde, Metas e Atividades FÃ­sicas
[components/UserPanel/HealthModal.tsx](components/UserPanel/HealthModal.tsx)

**Responsabilidade**: Gerenciar dados de saÃºde, metas de calorias e registro de atividades fÃ­sicas.

**SeÃ§Ãµes Principais**:

#### 6.1 Dados BÃ¡sicos
- Peso (kg), Altura (cm), Idade, Sexo
- CÃ¡lculo automÃ¡tico de IMC com classificaÃ§Ã£o colorida
- Cores dinÃ¢micas baseadas na classificaÃ§Ã£o (verde, amarelo, laranja, vermelho)

#### 6.2 Metas de Calorias
- **RefeiÃ§Ãµes por dia**: ConfigurÃ¡vel (1-6)
- **Calorias por refeiÃ§Ã£o**:
  - â˜€ï¸ CafÃ© da manhÃ£
  - ðŸ½ï¸ AlmoÃ§o
  - ðŸŒ™ Jantar
  - ðŸª Lanche
- **Quantidade de lanches**: Campo numÃ©rico (1, 2, 3, 4+)
- **Total diÃ¡rio**: Calculado automaticamente incluindo `snack_calories Ã— snackQuantity`

**Exemplo de cÃ¡lculo**:
```typescript
Total = breakfast_calories + lunch_calories + dinner_calories + (snack_calories Ã— snackQuantity)
// Ex: 400 + 600 + 600 + (200 Ã— 3) = 2200 kcal/dia
```

#### 6.3 Registro de Atividades FÃ­sicas
- **Autocomplete de atividades**: Busca em banco com 100+ atividades
- **Banco de dados de atividades**: [activitiesDatabase.ts](data/activitiesDatabase.ts)
- **CÃ¡lculo automÃ¡tico de calorias**: Baseado em MET values
- **FÃ³rmula de calorias queimadas**:
  ```typescript
  calories = MET Ã— weight(kg) Ã— time(hours)
  ```
- **Campos**:
  - Tipo de atividade (com autocomplete)
  - DuraÃ§Ã£o (minutos)
  - Calorias queimadas (calculado automaticamente)

**MET Values (Metabolic Equivalent of Task)**:
- Caminhada leve: 3.5 MET
- Corrida (8 km/h): 8.0 MET
- NataÃ§Ã£o moderada: 5.8 MET
- Ciclismo (20 km/h): 8.0 MET
- MusculaÃ§Ã£o: 6.0 MET

**Categorias de Atividades**:
- Caminhada e Corrida (10+ variaÃ§Ãµes)
- Ciclismo (6 variaÃ§Ãµes)
- NataÃ§Ã£o (5 variaÃ§Ãµes)
- Esportes Coletivos (15+)
- MusculaÃ§Ã£o e Academia (10+)
- Atividades DomÃ©sticas (20+)
- DanÃ§a (8 variaÃ§Ãµes)
- Artes Marciais (10+)
- E muito mais...

#### 6.4 HistÃ³rico de Atividades
- Componente colapsÃ¡vel com Ãºltimas atividades
- [ActivityHistory.tsx](components/UserPanel/ActivityHistory.tsx) - VisualizaÃ§Ã£o resumida
- ExibiÃ§Ã£o de atividade, duraÃ§Ã£o e calorias
- BotÃ£o para expandir histÃ³rico completo

#### 6.5 Assistente de IA
- BotÃ£o com gradiente roxo-rosa chamativo
- Abre chat nutricional com contexto do perfil
- SugestÃµes personalizadas baseadas em dados do usuÃ¡rio

---

### 7. HistoryModal - HistÃ³rico Completo
[components/UserPanel/HistoryModal.tsx](components/UserPanel/HistoryModal.tsx)

**Responsabilidade**: Visualizar histÃ³rico de refeiÃ§Ãµes, atividades fÃ­sicas e pesagens.

**Sistema de Abas**:
```typescript
type HistoryTab = 'meals' | 'activities' | 'weight'
```

#### 7.1 Aba: RefeiÃ§Ãµes
[components/UserPanel/MealHistory.tsx](components/UserPanel/MealHistory.tsx)

**Features**:
- Filtros: Ãšltima Semana | Ãšltimo MÃªs | Tudo
- Cards com detalhes de cada refeiÃ§Ã£o:
  - Tipo de refeiÃ§Ã£o (Ã­cone + nome)
  - Alimentos consumidos
  - Calorias totais
  - Macronutrientes (proteÃ­na, carboidratos, gorduras, fibras)
  - Data e hora
- EstatÃ­sticas:
  - Total de refeiÃ§Ãµes registradas
  - Total de calorias consumidas
  - MÃ©dia de calorias por refeiÃ§Ã£o
- **ExclusÃ£o com confirmaÃ§Ã£o**: Modal de confirmaÃ§Ã£o antes de deletar

#### 7.2 Aba: Atividades
[components/UserPanel/PhysicalActivityHistory.tsx](components/UserPanel/PhysicalActivityHistory.tsx)

**Features**:
- Filtros temporais (semana, mÃªs, tudo)
- Cards detalhados de atividades:
  - Nome da atividade
  - DuraÃ§Ã£o (minutos)
  - Calorias queimadas
  - Data e hora
- EstatÃ­sticas:
  - Total de atividades realizadas
  - Total de calorias queimadas
  - Total de minutos de exercÃ­cio
- ExclusÃ£o com modal de confirmaÃ§Ã£o

#### 7.3 Aba: Pesagens
[components/UserPanel/WeightHistory.tsx](components/UserPanel/WeightHistory.tsx)

**Features**:
- GrÃ¡fico de linha com evoluÃ§Ã£o do peso (Recharts)
- Lista de pesagens com:
  - Peso em kg
  - Data e hora
  - VariaÃ§Ã£o em relaÃ§Ã£o Ã  pesagem anterior (â†‘ +1.5kg ou â†“ -2.0kg)
- Registro de novo peso
- ExclusÃ£o com confirmaÃ§Ã£o
- VisualizaÃ§Ã£o de tendÃªncia (ganho/perda de peso)

#### 7.4 Assistente de IA no HistÃ³rico
- BotÃ£o idÃªntico ao HealthModal
- Contexto enriquecido com:
  - Dados do perfil
  - HistÃ³rico de refeiÃ§Ãµes recentes
  - HistÃ³rico de peso
  - Atividades fÃ­sicas

---

### 8. ConfirmDeleteModal - Modal de ConfirmaÃ§Ã£o
[components/ConfirmDeleteModal.tsx](components/ConfirmDeleteModal.tsx)

**Responsabilidade**: Modal reutilizÃ¡vel para confirmaÃ§Ã£o de exclusÃµes.

**Props**:
```typescript
interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string          // Ex: "Excluir RefeiÃ§Ã£o?"
  message: string        // Ex: "Esta aÃ§Ã£o nÃ£o pode ser desfeita."
  itemName?: string      // Ex: "CafÃ© da manhÃ£ - 400 kcal"
  isDeleting?: boolean   // Estado de loading durante exclusÃ£o
}
```

**Design**:
- Header vermelho-laranja (red-orange gradient)
- Backdrop escuro com blur (bg-black/70 backdrop-blur-sm)
- Z-index 60 (acima dos modais principais que usam z-50)
- BotÃµes de aÃ§Ã£o: Cancelar (cinza) e Excluir (vermelho)
- Loading state no botÃ£o de exclusÃ£o

**Uso**:
```typescript
<ConfirmDeleteModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  title="Excluir Atividade?"
  message="Esta aÃ§Ã£o nÃ£o pode ser desfeita."
  itemName={activityToDelete?.activity_type}
  isDeleting={isDeleting}
/>
```

---

### 9. NutritionChat - Assistente de IA Nutricional
[components/UserPanel/NutritionChat.tsx](components/UserPanel/NutritionChat.tsx)

**Responsabilidade**: Chat interativo com Gemini AI para orientaÃ§Ã£o nutricional contextualizada por horÃ¡rio.

**Contexto Fornecido Ã  IA**:
```typescript
interface ChatContext {
  profile?: UserProfile
  weightHistory?: WeightHistory[]
  recentMeals?: MealHistory[]
}
```

**Funcionalidades**:
- **ðŸ• ConsciÃªncia Temporal**: Detecta horÃ¡rio atual (manhÃ£/tarde/noite)
- **SaudaÃ§Ã£o DinÃ¢mica**: "Bom dia", "Boa tarde" ou "Boa noite" conforme horÃ¡rio
- **Contexto de RefeiÃ§Ã£o**: Mensagens personalizadas sobre a refeiÃ§Ã£o apropriada ao perÃ­odo
- HistÃ³rico de mensagens (usuÃ¡rio e assistente)
- Streaming de respostas (digitaÃ§Ã£o em tempo real)
- Contexto completo do usuÃ¡rio:
  - **HorÃ¡rio atual e perÃ­odo do dia**
  - Dados pessoais (peso, altura, idade, sexo)
  - IMC calculado
  - Metas de calorias por refeiÃ§Ã£o
  - HistÃ³rico de peso (Ãºltimos 10 registros)
  - RefeiÃ§Ãµes recentes (Ãºltimos 20 registros)
- SugestÃµes personalizadas baseadas em dados reais **e horÃ¡rio atual**
- Design com gradiente roxo-rosa no header

**Sistema de DetecÃ§Ã£o de HorÃ¡rio** ([nutritionChatService.ts:23-45](services/nutritionChatService.ts#L23-L45)):
```typescript
getTimeOfDayInfo(): {
  period: 'manhÃ£' | 'tarde' | 'noite'
  greeting: 'Bom dia' | 'Boa tarde' | 'Boa noite'
  mealContext: string
}

// PerÃ­odos:
// ManhÃ£: 5h - 12h â†’ CafÃ© da manhÃ£
// Tarde: 12h - 18h â†’ AlmoÃ§o/Lanches
// Noite: 18h - 5h â†’ Jantar
```

**Mensagem Inicial Contextualizada**:
```
${timeInfo.greeting}! ðŸ‘‹ Sou seu assistente nutricional personalizado!

${timeInfo.mealContext}

Posso ajudar vocÃª com dicas de alimentaÃ§Ã£o, anÃ¡lise de hÃ¡bitos,
sugestÃµes de refeiÃ§Ãµes e muito mais.

Como posso ajudar vocÃª hoje?
```

**Persona da IA**:
- Nutricionista especializado
- Linguagem acessÃ­vel e amigÃ¡vel
- Respostas baseadas em evidÃªncias cientÃ­ficas
- Considera histÃ³rico e perfil do usuÃ¡rio
- **Adapta sugestÃµes ao horÃ¡rio atual (NUNCA sugere cafÃ© da manhÃ£ Ã  noite)**
- SugestÃµes prÃ¡ticas e personalizadas

**System Instruction ReforÃ§ado** ([nutritionChatService.ts:161-192](services/nutritionChatService.ts#L161-L192)):
```
ðŸ• **CONTEXTO TEMPORAL CRÃTICO - LEIA COM ATENÃ‡ÃƒO:**
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
â° HORÃRIO ATUAL: ${period.toUpperCase()} (${greeting})
ðŸ“ CONTEXTO DA REFEIÃ‡ÃƒO: ${mealContext}

âš ï¸ REGRAS OBRIGATÃ“RIAS SOBRE HORÃRIO:
1. NUNCA sugira cafÃ© da manhÃ£ se for tarde ou noite
2. NUNCA sugira jantar se for manhÃ£
3. NUNCA sugira almoÃ§o se for noite
4. SEMPRE adapte suas sugestÃµes ao perÃ­odo atual
5. Se o usuÃ¡rio perguntar "o que comer?", responda baseado no horÃ¡rio atual
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

**Formato de Resposta:**
- SEMPRE inicie suas respostas considerando o horÃ¡rio atual
- Se for pergunta sobre alimentaÃ§Ã£o, mencione explicitamente o perÃ­odo do dia
- Exemplo manhÃ£: "Como Ã© manhÃ£, sugiro um cafÃ© da manhÃ£ com..."
- Exemplo tarde: "Para esta hora da tarde, recomendo..."
- Exemplo noite: "JÃ¡ que Ã© noite, o ideal seria um jantar leve..."
```

**Lembrete Visual no Prompt** ([nutritionChatService.ts:159](services/nutritionChatService.ts#L159)):
Antes de cada resposta, a IA recebe:
```
â° LEMBRETE: Agora Ã© ${period} (${greeting.toLowerCase()}). ${mealContext}
```

---

### 10. activitiesDatabase - Banco de Atividades FÃ­sicas
[data/activitiesDatabase.ts](data/activitiesDatabase.ts)

**Responsabilidade**: Banco de dados local com 100+ atividades fÃ­sicas e valores MET.

**Estrutura de Dados**:
```typescript
interface ActivityData {
  name: string      // Ex: "Corrida - moderada (8 km/h)"
  met: number       // Ex: 8.0 (Metabolic Equivalent of Task)
  category: string  // Ex: "Corrida"
}
```

**FunÃ§Ãµes Principais**:

#### searchActivities(query: string, limit?: number)
- Busca fuzzy em nomes de atividades
- Case-insensitive
- Retorna array de nomes ordenados por relevÃ¢ncia

#### getActivityMET(activityName: string)
- Busca exata do valor MET de uma atividade
- Retorna nÃºmero ou undefined

#### calculateCaloriesBurned(met: number, weightKg: number, durationMinutes: number)
- FÃ³rmula: `MET Ã— weight(kg) Ã— time(hours)`
- Retorna calorias arredondadas

**Categorias IncluÃ­das**:
- Caminhada e Corrida (11 atividades)
- Ciclismo (6 atividades)
- NataÃ§Ã£o (5 atividades)
- Esportes Coletivos (16 atividades)
- MusculaÃ§Ã£o e Academia (11 atividades)
- Yoga e Pilates (5 atividades)
- DanÃ§a (8 atividades)
- Artes Marciais (10 atividades)
- Atividades DomÃ©sticas (21 atividades)
- Jardinagem (5 atividades)
- Trabalho Manual (8 atividades)
- RecreaÃ§Ã£o (10 atividades)

**Total**: 116 atividades diferentes

---

### 11. PWAComponents - Componentes Progressive Web App
[components/PWAComponents.tsx](components/PWAComponents.tsx)

**Responsabilidade**: Gerenciar funcionalidades PWA (instalaÃ§Ã£o, offline, atualizaÃ§Ãµes).

#### 11.1 OfflineDetector
**Funcionalidade**: Detecta mudanÃ§as na conectividade e exibe banner informativo.

**Features**:
- Listener nos eventos `online` e `offline`
- Banner animado (slide-up) quando conexÃ£o muda
- Auto-hide apÃ³s 5 segundos quando volta online
- Cores distintas: vermelho (offline) vs verde (online)
- Mensagens claras: "VocÃª estÃ¡ offline" / "ConexÃ£o restaurada"

**ImplementaÃ§Ã£o**:
```typescript
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 5000);
  };

  const handleOffline = () => {
    setIsOnline(false);
    setShowBanner(true);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}, []);
```

#### 11.2 InstallPrompt
**Funcionalidade**: Banner customizado para instalaÃ§Ã£o do PWA.

**Features**:
- Listener no evento `beforeinstallprompt`
- Aparece apÃ³s 5 segundos da primeira visita
- BotÃ£o "Instalar App" com gradiente laranja
- BotÃ£o "Agora nÃ£o" para dispensar
- Armazena escolha em localStorage (nÃ£o incomoda novamente)
- Auto-hide apÃ³s instalaÃ§Ã£o bem-sucedida

**Fluxo**:
```
1. User visita app â†’ espera 5s
2. Banner aparece (slide-up animation)
3. User clica "Instalar":
   â†’ Chama deferredPrompt.prompt()
   â†’ Aguarda resposta do usuÃ¡rio
   â†’ Se aceitar: esconde banner, registra no localStorage
4. User clica "Agora nÃ£o":
   â†’ Esconde banner, registra no localStorage
```

#### 11.3 UpdateNotification
**Funcionalidade**: Notifica quando hÃ¡ nova versÃ£o do app disponÃ­vel.

**Features**:
- Detecta Service Worker em estado "waiting"
- Banner azul com botÃ£o "Atualizar Agora"
- Envia mensagem SKIP_WAITING para SW
- Recarrega pÃ¡gina apÃ³s ativaÃ§Ã£o do novo SW
- Design responsivo e nÃ£o invasivo

**ImplementaÃ§Ã£o**:
```typescript
const registration = await navigator.serviceWorker.ready;
if (registration.waiting) {
  setShowUpdate(true);
}

const handleUpdate = () => {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
};
```

#### 11.4 PWAManager
**Funcionalidade**: Wrapper que combina todos os componentes PWA.

**Uso em App.tsx**:
```typescript
import { PWAManager } from './components/PWAComponents';

function App() {
  return (
    <>
      <PWAManager />
      {/* resto do app */}
    </>
  );
}
```

---

### 12. backgroundSync - Sistema de SincronizaÃ§Ã£o Offline
[utils/backgroundSync.tsx](utils/backgroundSync.tsx)

**Responsabilidade**: Gerenciar fila de sincronizaÃ§Ã£o quando usuÃ¡rio estÃ¡ offline.

#### 12.1 Estrutura de Dados

```typescript
interface SyncQueueItem {
  id: string                              // Identificador Ãºnico
  type: 'meal' | 'weight' | 'activity'   // Tipo de dado
  data: any                               // Dados a serem sincronizados
  timestamp: number                       // Quando foi adicionado
  retries: number                         // Tentativas de sincronizaÃ§Ã£o
}
```

#### 12.2 FunÃ§Ãµes Principais

**addToSyncQueue(type, data)**:
- Adiciona item Ã  fila de sincronizaÃ§Ã£o
- Gera ID Ãºnico: `${type}_${timestamp}_${random}`
- Persiste em localStorage
- Dispara evento customizado 'sync-queue-updated'

**syncPendingData()**:
- Processa todos os itens da fila
- Tenta sincronizar com backend (Supabase)
- Remove da fila se bem-sucedido
- Incrementa retries se falhar (mÃ¡x 3)
- Remove da fila apÃ³s 3 tentativas falhas
- Dispara evento de atualizaÃ§Ã£o

**getSyncQueue()** / **clearSyncQueue()**:
- Getters/setters para manipular fila no localStorage
- Parse com error handling

#### 12.3 Hook useBackgroundSync

**Funcionalidade**: Hook React para status da fila.

```typescript
const { pendingCount } = useBackgroundSync();

// Retorna:
// - pendingCount: nÃºmero de itens pendentes
// - Listener em 'sync-queue-updated' com auto-update
```

#### 12.4 SyncStatusBadge Component

**Funcionalidade**: Badge flutuante mostrando itens pendentes.

**Features**:
- PosiÃ§Ã£o: canto superior direito (fixed)
- Badge azul com contador
- BotÃ£o para sincronizar manualmente
- Loading state durante sincronizaÃ§Ã£o
- SÃ³ aparece se pendingCount > 0
- Z-index 1000 (acima de tudo)

**Exemplo de uso**:
```typescript
import { SyncStatusBadge } from './utils/backgroundSync.tsx';

<SyncStatusBadge />
// Mostra: "ðŸ”„ 3 pendentes | Sincronizar"
```

#### 12.5 InicializaÃ§Ã£o

**initBackgroundSync()**:
- Registra Service Worker
- Registra sync tag 'sync-queue'
- Listener em evento 'online' â†’ auto-sync
- Chamado no useEffect do App.tsx

```typescript
useEffect(() => {
  console.log('ðŸš€ Inicializando PWA...');
  initBackgroundSync();
}, []);
```

---

### 13. bmiUtils - CÃ¡lculos de IMC
[utils/bmiUtils.ts](utils/bmiUtils.ts)

**Responsabilidade**: Calcular e classificar Ãndice de Massa Corporal.

**FunÃ§Ã£o Principal**:
```typescript
getBMIInfo(weight: number, height: number): BMIInfo

interface BMIInfo {
  value: number      // IMC calculado
  label: string      // Ex: "Peso Normal"
  color: string      // Cor da classificaÃ§Ã£o (hex)
}
```

**ClassificaÃ§Ã£o OMS**:
- **Abaixo do peso** (< 18.5): #60a5fa (azul)
- **Peso normal** (18.5 - 24.9): #4ade80 (verde)
- **Sobrepeso** (25.0 - 29.9): #fbbf24 (amarelo)
- **Obesidade Grau I** (30.0 - 34.9): #fb923c (laranja)
- **Obesidade Grau II** (35.0 - 39.9): #f87171 (vermelho claro)
- **Obesidade Grau III** (â‰¥ 40.0): #dc2626 (vermelho escuro)

**FÃ³rmula**:
```typescript
BMI = weight(kg) / (height(m) Ã— height(m))
```

---

## Sistema de Tipos (types.ts)

[types.ts](types.ts)

```typescript
// Macronutrientes base
interface MacroNutrients {
  protein: number
  carbs: number
  fat: number
}

// PorÃ§Ã£o individual de alimento
interface Portion extends MacroNutrients {
  foodName: string
  grams: number
  homeMeasure: string
  calories: number
  macros: MacroNutrients & { fiber?: number }
  glycemicIndex?: number
}

// Dados glicÃªmicos
interface GlycemicData {
  index: number  // Ãndice GlicÃªmico
  load: number   // Carga GlicÃªmica
}

// Resultado completo da refeiÃ§Ã£o
interface MealResult {
  totalCalories: number
  totalMacros: MacroNutrients & { fiber: number }
  glycemicData: GlycemicData
  portions: Portion[]
  suggestions: string[]
}

// Tipos de refeiÃ§Ã£o
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
```

---

## ConfiguraÃ§Ã£o e Build

### Environment Variables

**.env.local** (nÃ£o commitado no git):
```bash
# Gemini AI
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo

# Supabase
VITE_SUPABASE_URL=https://keawapzxqoyesptpwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Importante**: Vite usa o prefixo `VITE_` para expor variÃ¡veis ao client.

Acesso no cÃ³digo:
```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Vite Config
[vite.config.ts](vite.config.ts)

**Features**:
- **Dev Server**: Porta 3000 (com fallback automÃ¡tico), host 0.0.0.0 (acesso em rede)
- **Path Aliases**: `@/*` resolve para root do projeto
- **Plugin React**: JSX transform + Fast Refresh
- **Build Optimization**: Code splitting com manualChunks
- **PWA Support**: ConfiguraÃ§Ã£o para caching e chunks

**Code Splitting**:
```typescript
rollupOptions: {
  output: {
    manualChunks: {
      'react-vendor': ['react', 'react-dom'],
      'charts': ['recharts'],
      'supabase': ['@supabase/supabase-js'],
      'gemini': ['@google/genai'],
    }
  }
}
```

### PWA Manifest
[public/manifest.json](public/manifest.json)

**Responsabilidade**: ConfiguraÃ§Ã£o do Progressive Web App.

**ConfiguraÃ§Ã£o Completa**:
```json
{
  "name": "NutriMais AI - DiÃ¡rio Alimentar Inteligente",
  "short_name": "NutriMais AI",
  "description": "Planejador nutricional inteligente com IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e1e1e",
  "theme_color": "#ff6b35",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "pt-BR",
  "dir": "ltr",
  "categories": ["health", "lifestyle", "productivity"],
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "Nova RefeiÃ§Ã£o", "url": "/?action=new-meal", "description": "Planejar nova refeiÃ§Ã£o" },
    { "name": "HistÃ³rico", "url": "/?action=history", "description": "Ver histÃ³rico de refeiÃ§Ãµes" },
    { "name": "Chat IA", "url": "/?action=chat", "description": "Falar com assistente nutricional" }
  ]
}
```

**Campos Importantes**:
- **display: standalone**: App abre sem barra de navegaÃ§Ã£o do browser
- **theme_color**: Cor da barra de status (Android)
- **background_color**: Cor de fundo durante splash screen
- **icons**: 8 tamanhos para diferentes dispositivos
- **shortcuts**: Atalhos no menu de contexto do Ã­cone (Android)

### Service Worker
[public/sw.js](public/sw.js)

**Responsabilidade**: Cache de assets e funcionamento offline.

#### EstratÃ©gias de Cache

**1. Cache First (Assets EstÃ¡ticos)**:
```javascript
// Para: JS, CSS, fontes, Ã­cones
// Fluxo: Cache â†’ se nÃ£o tem â†’ Network â†’ adiciona ao cache
```
**Uso**: Arquivos que nÃ£o mudam frequentemente (bundle.js, icons, fonts)

**2. Network First (APIs e Dados DinÃ¢micos)**:
```javascript
// Para: Gemini API, Supabase API
// Fluxo: Network â†’ se falhar â†’ Cache
```
**Uso**: Dados que precisam estar sempre atualizados

**3. Stale While Revalidate (Imagens)**:
```javascript
// Para: Imagens, splash screens
// Fluxo: Cache (resposta imediata) + Network (atualiza cache em background)
```
**Uso**: Assets que podem ser mostrados enquanto atualizam

#### Eventos do Service Worker

**install**:
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // ... outros assets crÃ­ticos
      ]);
    })
  );
  self.skipWaiting(); // Ativa imediatamente
});
```

**activate**:
```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName); // Remove caches antigos
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume controle imediatamente
});
```

**fetch**:
```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Roteamento baseado em URL
  if (url.origin === location.origin) {
    // Cache First para assets locais
    event.respondWith(cacheFirst(request));
  } else if (url.hostname.includes('googleapis.com') || url.hostname.includes('supabase.co')) {
    // Network First para APIs
    event.respondWith(networkFirst(request));
  } else {
    // Stale While Revalidate para imagens
    event.respondWith(staleWhileRevalidate(request));
  }
});
```

**sync** (Background Sync):
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncPendingData());
  }
});
```

**message** (Skip Waiting):
```javascript
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

#### Versioning e Cache Busting
```javascript
const CACHE_NAME = 'nutrimais-v1';
const RUNTIME_CACHE = 'nutrimais-runtime-v1';
const IMAGE_CACHE = 'nutrimais-images-v1';

// Ao fazer deploy nova versÃ£o:
// 1. Incrementar CACHE_NAME para 'nutrimais-v2'
// 2. Service Worker detecta mudanÃ§a
// 3. Evento 'activate' remove caches antigos
// 4. Novos assets sÃ£o baixados e cacheados
```

### TypeScript Config
[tsconfig.json](tsconfig.json)

**ConfiguraÃ§Ãµes Chave**:
- Target: ES2022
- Module: ESNext (para Vite)
- JSX: react-jsx (novo transform)
- Decorators experimentais habilitados
- Import de extensÃµes .ts permitido
- No emit (Vite gerencia build)

---

## Design System (Tailwind)

### Paleta de Cores

**Backgrounds**:
- `primary-bg`: #1e1e1e (fundo principal)
- `secondary-bg`: #2d2d30 (cards secundÃ¡rios)
- `card-bg`: #252526 (cards principais)
- `hover-bg`: #3e3e42 (estados hover)

**Text**:
- `text-primary`: #cccccc
- `text-secondary`: #969696
- `text-muted`: #6b6b6b
- `text-bright`: #ffffff

**Accents**:
- `accent-orange`: #ff6b35 (primÃ¡rio)
- `accent-coral`: #ff8c61 (hover)
- `accent-peach`: #ffb088 (destaques)

**Functional**:
- `success`: #4ade80 (verde)
- `warning`: #fbbf24 (amarelo)
- `error`: #f87171 (vermelho)
- `info`: #60a5fa (azul)

**Macronutrientes**:
- `protein`: #10b981 (verde) - 30%
- `carbs`: #fb923c (laranja) - 40%
- `fat`: #fbbf24 (amarelo) - 30%
- `fiber`: #4ade80 (verde claro)

### AnimaÃ§Ãµes

```javascript
fade-in: 0.5s ease-in-out
slide-up: 0.3s ease-out
pulse-soft: 2s infinite (hover em botÃµes)
```

### Gradientes

```javascript
gradient-primary: linear-gradient(135deg, #ff6b35 0%, #ff8c61 100%)
gradient-dark: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%)
```

---

## Fluxo de Dados Completo

```
1. USER ACTIONS
   â””â”€> MealPlanner Component
       â”œâ”€> Seleciona tipo de refeiÃ§Ã£o
       â”œâ”€> Define meta de calorias
       â”œâ”€> Adiciona alimentos
       â””â”€> Clica "Calcular PorÃ§Ãµes Ideais"

2. API REQUEST
   â””â”€> handleCalculate (App.tsx)
       â””â”€> calculateMealPortions (geminiService.ts)
           â”œâ”€> Calcula metas de macros (40/30/30)
           â”œâ”€> Monta prompt estruturado com metas
           â”œâ”€> Envia para Gemini 2.0 Flash Exp
           â””â”€> Recebe JSON estruturado

3. STATE UPDATE
   â””â”€> setMealResult (App.tsx)
       â””â”€> Passa para MealResultDisplay

4. RENDER & INTERACTION
   â””â”€> MealResultDisplay Component
       â”œâ”€> Cria originalPortionsMap (useMemo)
       â”œâ”€> Inicializa inputValues (Map<string, string>)
       â”œâ”€> Exibe porÃ§Ãµes calculadas
       â”œâ”€> Renderiza MacroChart com totalCalories
       â”œâ”€> Permite ediÃ§Ã£o de porÃ§Ãµes
       â””â”€> Recalcula em tempo real do ORIGINAL
```

---

## Features AvanÃ§adas

### 1. EdiÃ§Ã£o Interativa com State Derivado

O componente `MealResult` mantÃ©m trÃªs estados:
- **originalPortionsMap**: Map com dados puros da API (useMemo, para cÃ¡lculos)
- **editedResult**: Dados atuais modificados pelo usuÃ¡rio
- **inputValues**: Map<string, string> com valores dos campos de texto

BenefÃ­cios:
- CÃ¡lculos sempre do original (evita composiÃ§Ã£o de erros)
- Inputs podem ficar vazios durante ediÃ§Ã£o
- RestauraÃ§Ã£o automÃ¡tica no blur
- OtimizaÃ§Ã£o com useMemo

### 2. RecÃ¡lculo Inteligente de Nutrientes

**Fibras**: Recalculadas proporcionalmente
```typescript
newFiber = originalFiber Ã— (newGrams / originalGrams)
```

**Ãndice GlicÃªmico**: MÃ©dia ponderada pelos carboidratos
```typescript
weightedGI = Î£(GI_i Ã— carbs_i) / totalCarbs
```

**Carga GlicÃªmica**: FÃ³rmula padrÃ£o
```typescript
GL = (GI Ã— totalCarbs) / 100
```

### 3. PersistÃªncia Local

```typescript
localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods))
```

- Favoritos persistem entre sessÃµes
- Parse com error handling (try-catch)
- InicializaÃ§Ã£o com fallback para array vazio

### 4. Responsividade

**Breakpoints Tailwind**:
- Mobile-first approach
- `md:` (768px+): Layouts side-by-side
- `lg:` (1024px+): Grid 5 colunas (3+2)

### 5. ValidaÃ§Ãµes

- Duplicatas de alimentos (case-insensitive)
- Valores numÃ©ricos mÃ­nimos (calorias > 0)
- BotÃ£o desabilitado sem alimentos selecionados
- Inputs com constraints (type="number", min="0")
- ValidaÃ§Ã£o de campo vazio durante ediÃ§Ã£o

---

## SeguranÃ§a e Boas PrÃ¡ticas

### Environment Variables
```bash
# .env.local (nÃ£o commitado)
VITE_GEMINI_API_KEY=your_api_key_here
```

**IMPORTANTE**: Vite requer prefixo `VITE_` para expor ao client.

### Error Handling
- Try-catch em todas chamadas async
- Fallback messages user-friendly
- Console logging para debugging
- UI feedback para errors (toast vermelho)

### Type Safety
- Interfaces rÃ­gidas para API responses
- Type guards implÃ­citos (TypeScript strict mode)
- Props tipadas em todos componentes
- Enums via union types (`MealType`)

### Accessibility
- Semantic HTML (`<label>`, `<form>`, `<button>`)
- ARIA labels para inputs (`aria-label`)
- Keyboard navigation support
- Focus states visÃ­veis (`:focus` rings)

---

## Scripts de Desenvolvimento

```json
{
  "dev": "vite",                    // Dev server (porta 3000+)
  "build": "vite build",            // Build de produÃ§Ã£o
  "preview": "vite preview",        // Preview do build
  "validate:pwa": "node scripts/validate-pwa.js"  // Validar setup PWA
}
```

### Scripts PWA

#### 1. generate-icons.html
[scripts/generate-icons.html](scripts/generate-icons.html)

**Responsabilidade**: Gerar Ã­cones PWA em 8 tamanhos diferentes.

**Como usar**:
1. Abrir arquivo no navegador
2. Clicar em "Gerar Todos os Ãcones"
3. Downloads automÃ¡ticos dos 8 PNGs
4. Mover para `public/icons/`

**Design do Ãcone**:
- Background: Gradiente laranja (#ff6b35 â†’ #ff8c61)
- SÃ­mbolo: MaÃ§Ã£ branca estilizada
- Texto: "AI" em branco bold
- Tamanhos: 72, 96, 128, 144, 152, 192, 384, 512 pixels

**Tecnologia**: HTML5 Canvas API

#### 2. generate-splash.html
[scripts/generate-splash.html](scripts/generate-splash.html)

**Responsabilidade**: Gerar splash screens para iOS em 13 tamanhos.

**Como usar**:
1. Abrir arquivo no navegador
2. Clicar em "Gerar Todas as Splash Screens"
3. Downloads automÃ¡ticos dos 13 PNGs
4. Mover para `public/splash/`

**Design da Splash Screen**:
- Background: Gradiente escuro (#1e1e1e â†’ #2d2d30)
- Logo: MaÃ§Ã£ + "AI" centralizado
- Nome: "NutriMais AI" em branco
- Loading bar: Animado em laranja

**Tamanhos iOS**:
- iPhone SE: 640Ã—1136
- iPhone 8: 750Ã—1334
- iPhone XR: 828Ã—1792
- iPhone X/XS: 1125Ã—2436
- iPhone 12/13: 1170Ã—2532
- iPhone 14 Pro: 1179Ã—2556
- iPhone 12/13 Pro Max: 1242Ã—2688
- iPhone 14 Pro Max: 1284Ã—2778
- iPhone 15 Pro Max: 1290Ã—2796
- iPad 9.7": 1536Ã—2048
- iPad 10.2": 1668Ã—2224
- iPad Air: 1668Ã—2388
- iPad Pro 12.9": 2048Ã—2732

#### 3. validate-pwa.js
[scripts/validate-pwa.js](scripts/validate-pwa.js)

**Responsabilidade**: Validar se todos os arquivos PWA estÃ£o presentes.

**Como usar**:
```bash
npm run validate:pwa
```

**ValidaÃ§Ãµes**:
- âœ… manifest.json existe e Ã© vÃ¡lido
- âœ… sw.js (Service Worker) existe
- âœ… 8 Ã­cones presentes em public/icons/
- âœ… 13 splash screens em public/splash/
- âœ… index.html tem meta tags PWA
- âœ… index.html linka manifest.json
- âœ… App.tsx importa PWAComponents
- âœ… utils/backgroundSync.tsx existe
- âœ… components/PWAComponents.tsx existe

**Output**:
```
âœ… PWA Setup completo!
Arquivos validados: 24/24

PrÃ³ximos passos:
1. npm run build
2. npm run preview
3. Testar instalaÃ§Ã£o em dispositivo mÃ³vel
```

### InstalaÃ§Ã£o e ExecuÃ§Ã£o

```bash
# 1. Clonar repositÃ³rio
git clone https://github.com/netsacolas/NutriMais.git
cd NutriMais

# 2. Instalar dependÃªncias
npm install

# 3. Configurar variÃ¡veis de ambiente
# Criar .env.local na raiz com:
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 4. Configurar Supabase
# Executar as migraÃ§Ãµes SQL no painel do Supabase:
# - migrations/001_initial_schema.sql
# - migrations/002_add_meal_history.sql
# - migrations/003_add_weight_history.sql
# - migrations/004_add_physical_activities_and_meal_goals.sql

# 5. Rodar desenvolvimento
npm run dev

# Acesso: http://localhost:3000 (ou prÃ³xima porta disponÃ­vel)
```

### ConfiguraÃ§Ã£o do Supabase

1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Executar as migraÃ§Ãµes SQL (pasta migrations/) no SQL Editor do Supabase
4. Copiar URL do projeto e Anon Key para .env.local
5. Habilitar autenticaÃ§Ã£o por email no painel Authentication

---

## Performance e OtimizaÃ§Ãµes

### Bundle Size
- React 19.2.0 via CDN (nÃ£o empacotado)
- Recharts 3.3.0 via CDN
- TailwindCSS via CDN (zero build overhead)
- CÃ³digo principal < 50KB (minified)

### Runtime Optimizations
- `useCallback` para prevenir re-renders
- `useMemo` para cÃ¡lculos pesados (originalPortionsMap, chartData)
- `useState` batching automÃ¡tico (React 19)
- Conditional rendering (`&&`, ternÃ¡rios)
- Map para lookups O(1) vs array O(n)

### Network
- API calls debounced (via user action, nÃ£o auto-trigger)
- JSON response schema para respostas concisas
- CDN caching para dependencies
- Model otimizado: gemini-2.0-flash-exp

---

## HistÃ³rico de AlteraÃ§Ãµes

### Update 2025-10-26 (HorÃ¡rio Atual)
**Assistente Nutricional com ConsciÃªncia Temporal**

- **Sistema de DetecÃ§Ã£o de HorÃ¡rio**:
  - Nova funÃ§Ã£o `getTimeOfDayInfo()` que detecta perÃ­odo do dia (manhÃ£/tarde/noite)
  - Retorna saudaÃ§Ã£o apropriada ("Bom dia", "Boa tarde", "Boa noite")
  - Contexto de refeiÃ§Ã£o especÃ­fico para cada perÃ­odo
  - PerÃ­odos definidos: ManhÃ£ (5h-12h), Tarde (12h-18h), Noite (18h-5h)

- **Mensagem Inicial Contextualizada**:
  - SaudaÃ§Ã£o dinÃ¢mica baseada no horÃ¡rio atual
  - Mensagem personalizada sobre refeiÃ§Ã£o apropriada ao perÃ­odo
  - ExperiÃªncia mais natural e humanizada

- **Context Awareness na IA**:
  - HorÃ¡rio atual incluÃ­do no contexto do usuÃ¡rio
  - System instruction reforÃ§ado com Ãªnfase visual (emojis, linhas separadoras)
  - Regras obrigatÃ³rias sobre horÃ¡rio (NUNCA cafÃ© da manhÃ£ Ã  noite, etc)
  - Formato de resposta prescritivo com exemplos concretos

- **Lembrete Visual no Prompt**:
  - Cada mensagem do usuÃ¡rio recebe lembrete do horÃ¡rio atual
  - â° LEMBRETE: Agora Ã© [perÃ­odo] ([saudaÃ§Ã£o]). [contexto da refeiÃ§Ã£o]
  - Aumenta significativamente a aderÃªncia da IA ao contexto temporal

- **Melhorias no System Instruction**:
  - SeÃ§Ã£o "CONTEXTO TEMPORAL CRÃTICO" com destaque visual
  - 5 regras obrigatÃ³rias sobre horÃ¡rio
  - Exemplos de como formatar respostas por perÃ­odo
  - ÃŠnfase com MAIÃšSCULAS e emojis para chamar atenÃ§Ã£o

- **Arquivos Modificados**:
  - [services/nutritionChatService.ts](services/nutritionChatService.ts): LÃ³gica de detecÃ§Ã£o de horÃ¡rio e prompts
  - [components/UserPanel/NutritionChat.tsx](components/UserPanel/NutritionChat.tsx): Mensagem inicial dinÃ¢mica
  - [CLAUDE.md](CLAUDE.md): DocumentaÃ§Ã£o atualizada

### Commit ca9d03d (2025-10-26)
**Funcionando com PWA - Inicial**

- **Progressive Web App (PWA) implementado**:
  - Manifest.json com configuraÃ§Ã£o completa
  - Service Worker com 3 estratÃ©gias de cache
  - 8 Ã­cones em mÃºltiplos tamanhos (72x72 atÃ© 512x512)
  - 13 splash screens para iOS (iPhone SE atÃ© iPad Pro)
  - App instalÃ¡vel em Android, iOS e Desktop

- **Componentes PWA**:
  - OfflineDetector: Banner de status de conexÃ£o
  - InstallPrompt: Banner customizado para instalaÃ§Ã£o
  - UpdateNotification: NotificaÃ§Ã£o de nova versÃ£o
  - PWAManager: Wrapper que combina todos os componentes

- **Sistema de SincronizaÃ§Ã£o Offline**:
  - Fila de sincronizaÃ§Ã£o em localStorage
  - Background Sync API para processar quando voltar online
  - SyncStatusBadge: Badge flutuante com contador de pendÃªncias
  - Auto-sync quando conexÃ£o Ã© restaurada
  - Retry logic (mÃ¡ximo 3 tentativas)

- **Service Worker Features**:
  - Cache First: Assets estÃ¡ticos (JS, CSS, Ã­cones)
  - Network First: APIs dinÃ¢micas (Gemini, Supabase)
  - Stale While Revalidate: Imagens e splash screens
  - Versioning e cache busting
  - Background sync support

- **Build Optimization**:
  - Code splitting com manualChunks (react, charts, supabase, gemini)
  - Assets separados para melhor caching
  - MinificaÃ§Ã£o com terser

- **Scripts de GeraÃ§Ã£o**:
  - generate-icons.html: Gera 8 Ã­cones PWA automaticamente
  - generate-splash.html: Gera 13 splash screens iOS
  - validate-pwa.js: Valida setup completo do PWA

- **DocumentaÃ§Ã£o**:
  - PWA_SETUP_GUIDE.md (7000+ palavras)
  - PWA_README.md (quick start)
  - QUICK_START_PWA.md (checklist 15 min)
  - PWA_COMPLETE_SUMMARY.md (resumo executivo)
  - PWA_INTEGRATION_EXAMPLE.tsx (exemplos de cÃ³digo)

- **Melhorias no index.html**:
  - Reestruturado para carregar React app corretamente
  - Meta tags PWA (theme-color, apple-mobile-web-app)
  - Links para manifest e splash screens
  - TailwindCSS CDN com configuraÃ§Ã£o customizada

- **Landing Page Preservada**:
  - Antiga index.html renomeada para landing.html
  - Mantida como referÃªncia/backup

### Commit 648c060 (2025-10-25)
**Sistema completo de usuÃ¡rio, atividades fÃ­sicas e histÃ³ricos**

- **Sistema de autenticaÃ§Ã£o com Supabase**:
  - Login e cadastro de usuÃ¡rios
  - RecuperaÃ§Ã£o de sessÃ£o
  - Perfil de usuÃ¡rio com dados pessoais e metas de calorias

- **Painel de UsuÃ¡rio completo**:
  - UserPanel com botÃµes de aÃ§Ã£o (Perfil, SaÃºde, HistÃ³rico, Sair)
  - ProfileModal para ediÃ§Ã£o de perfil e senha
  - HealthModal com dados de saÃºde, metas e atividades
  - HistoryModal com 3 abas (RefeiÃ§Ãµes, Atividades, Pesagens)

- **Sistema de Atividades FÃ­sicas**:
  - Banco de dados com 116 atividades e valores MET
  - Autocomplete para seleÃ§Ã£o de atividades
  - CÃ¡lculo automÃ¡tico de calorias queimadas
  - HistÃ³rico completo de atividades
  - EstatÃ­sticas (total atividades, calorias, minutos)

- **Metas de Calorias**:
  - ConfiguraÃ§Ã£o de calorias por refeiÃ§Ã£o (cafÃ©, almoÃ§o, jantar, lanche)
  - **Campo quantidade de lanches**: Multiplicador simples (input numÃ©rico)
  - CÃ¡lculo automÃ¡tico de total diÃ¡rio
  - IntegraÃ§Ã£o com MealPlanner (auto-populaÃ§Ã£o de metas)

- **HistÃ³rico de RefeiÃ§Ãµes**:
  - Armazenamento de refeiÃ§Ãµes planejadas
  - VisualizaÃ§Ã£o com filtros (semana, mÃªs, tudo)
  - EstatÃ­sticas de consumo
  - Cards detalhados com macros

- **HistÃ³rico de Peso**:
  - Registro de pesagens
  - GrÃ¡fico de evoluÃ§Ã£o (Recharts)
  - CÃ¡lculo de variaÃ§Ãµes
  - TendÃªncias de ganho/perda

- **Assistente de IA Nutricional**:
  - Chat interativo com Gemini AI
  - Contexto completo do usuÃ¡rio
  - SugestÃµes personalizadas
  - BotÃ£o com gradiente roxo-rosa destacado

- **Modal de ConfirmaÃ§Ã£o**:
  - Componente ConfirmDeleteModal reutilizÃ¡vel
  - Design com header vermelho-laranja
  - Estados de loading
  - Z-index correto (60 sobre modais principais)

- **Melhorias de UX/UI**:
  - Backdrop escuro com blur (bg-black/70 backdrop-blur-sm)
  - BotÃ£o AI Assistant mais visÃ­vel
  - IMC com cores dinÃ¢micas
  - AnimaÃ§Ãµes e transiÃ§Ãµes suaves

### Commit 0ca0178 (2025-10-25)
**Atualizar distribuiÃ§Ã£o de macros para 40/30/30 e corrigir ediÃ§Ã£o de porÃ§Ãµes**

- **DistribuiÃ§Ã£o de macronutrientes alterada**:
  - 40% carboidratos (antes 34%)
  - 30% proteÃ­na (antes 33%)
  - 30% gordura (antes 33%)

- **Bug fix: EdiÃ§Ã£o de porÃ§Ãµes**:
  - Adicionado estado `inputValues` separado
  - Permite apagar primeiro dÃ­gito sem bloquear
  - Campo pode ficar vazio durante ediÃ§Ã£o
  - RestauraÃ§Ã£o automÃ¡tica no onBlur

- **Melhorias no cÃ¡lculo pela IA**:
  - Prompt atualizado com distribuiÃ§Ã£o 40/30/30
  - Exemplos detalhados no system instruction
  - RemoÃ§Ã£o de console.logs desnecessÃ¡rios

### Commit 9a8b066 (anterior)
- CorreÃ§Ã£o de bug: Chart mostrando total diferente da soma
- Fix: RecÃ¡lculo baseado em valores originais (nÃ£o compostos)
- ImplementaÃ§Ã£o de fibras e Ã­ndice glicÃªmico dinÃ¢micos

### Commit fc2278e (inicial)
- Setup inicial do projeto
- IntegraÃ§Ã£o com Gemini AI
- DistribuiÃ§Ã£o 33/33/34
- Sistema de favoritos
- EdiÃ§Ã£o bÃ¡sica de porÃ§Ãµes

---

## Problemas Resolvidos

### 1. Environment Variables (Vite)
**Problema**: Erro "API key not valid"
**Causa**: Usando `process.env.API_KEY` em vez de `import.meta.env.VITE_GEMINI_API_KEY`
**SoluÃ§Ã£o**: Alterar para sintaxe Vite com prefixo `VITE_`

### 2. RecÃ¡lculo de PorÃ§Ãµes Incorreto
**Problema**: Aumentar porÃ§Ã£o diminuÃ­a calorias totais
**Causa**: CÃ¡lculo baseado em valores jÃ¡ editados (composiÃ§Ã£o de erros)
**SoluÃ§Ã£o**: Sempre calcular do `originalPortionsMap` usando useMemo

### 3. Chart com Total Diferente
**Problema**: Chart mostrava 555 kcal mas porÃ§Ãµes somavam 548 kcal
**Causa**: Erros de arredondamento ao calcular total internamente
**SoluÃ§Ã£o**: Passar `totalCalories` como prop para o MacroChart

### 4. Fibras e IG nÃ£o Atualizavam
**Problema**: Valores ficavam fixos como "(original)"
**Causa**: NÃ£o estavam sendo recalculados dinamicamente
**SoluÃ§Ã£o**: Implementar recÃ¡lculo proporcional de fibras e IG ponderado

### 5. ImpossÃ­vel Apagar Primeiro DÃ­gito
**Problema**: NÃ£o conseguia apagar completamente o valor do input
**Causa**: Handler bloqueava quando `newGramsStr === ''`
**SoluÃ§Ã£o**: Estado separado `inputValues` permite vazio, com restauraÃ§Ã£o no onBlur

### 6. DistribuiÃ§Ã£o de Macros Incorreta
**Problema**: AI distribuÃ­a totalMacros em 1/3, mas porÃ§Ãµes nÃ£o somavam corretamente
**Causa**: InstruÃ§Ãµes ambÃ­guas no prompt
**SoluÃ§Ã£o**: Calcular metas exatas em gramas, fornecer exemplo detalhado, enfatizar SOMA

### 7. Design Quebrado do Campo de Lanches
**Problema**: BotÃµes +/âˆ’ com "3x" quebravam o layout do campo de lanche
**Causa**: Excesso de elementos inline no mesmo container
**SoluÃ§Ã£o**: Separar em dois campos distintos:
  - Campo de calorias do lanche (200 kcal)
  - Campo de quantidade de lanches (1, 2, 3, 4+)
  - Layout limpo e simples com input type="number"

---

## PossÃ­veis Melhorias Futuras

### Features
1. âœ… ~~**HistÃ³rico de RefeiÃ§Ãµes**~~ - Implementado com Supabase
2. âœ… ~~**AutenticaÃ§Ã£o**~~ - Implementado com Supabase
3. âœ… ~~**HistÃ³rico de Peso**~~ - Implementado com grÃ¡fico de evoluÃ§Ã£o
4. âœ… ~~**Atividades FÃ­sicas**~~ - Implementado com banco de 116 atividades
5. âœ… ~~**Modo Offline**~~ - PWA com Service Worker e Background Sync
6. **Metas DiÃ¡rias**: Dashboard com soma de mÃºltiplas refeiÃ§Ãµes e grÃ¡fico consolidado
7. **ExportaÃ§Ã£o**: PDF ou imagem do plano nutricional
8. **Banco de Alimentos**: Autocomplete com tabela TACO/USDA oficial
9. **DistribuiÃ§Ã£o CustomizÃ¡vel**: Permitir usuÃ¡rio ajustar % de macros (ex: 30/40/30)
10. **Metas de Macros**: AlÃ©m de calorias, configurar gramas de proteÃ­na/carbs/gordura
11. **Receitas**: Salvar combinaÃ§Ãµes de alimentos como receitas favoritas
12. **Planejamento Semanal**: Planejar refeiÃ§Ãµes para a semana inteira
13. **Push Notifications**: Lembretes de refeiÃ§Ãµes e registro de atividades (Web Push API)
14. **Compartilhamento**: Compartilhar planos nutricionais via Web Share API
15. **Camera API**: Tirar foto de alimentos para anÃ¡lise com IA

### TÃ©cnicas
1. **React Query**: Cache e sincronizaÃ§Ã£o de estado servidor
2. **Zod**: ValidaÃ§Ã£o runtime de schemas
3. **Vitest**: Testes unitÃ¡rios e integraÃ§Ã£o
4. âœ… ~~**PWA**~~ - Manifest + Service Worker + Background Sync implementado
5. **i18n**: InternacionalizaÃ§Ã£o (pt-BR, en-US, es-ES)
6. **Analytics**: Posthog ou Google Analytics
7. **Web Push API**: NotificaÃ§Ãµes push nativas
8. **Web Share API**: Compartilhamento nativo do dispositivo
9. **IndexedDB**: Banco de dados local para cache avanÃ§ado

### UX
1. **Dark/Light Mode Toggle**: PreferÃªncia de tema persistida
2. **Drag & Drop**: Reordenar alimentos na lista
3. **SugestÃµes Inteligentes**: Baseadas em histÃ³rico do usuÃ¡rio
4. **ComparaÃ§Ã£o Nutricional**: Side-by-side de diferentes planos
5. **NotificaÃ§Ãµes**: Lembretes de refeiÃ§Ãµes (PWA)
6. **Calculadora de IMC/TMB**: SugestÃ£o de calorias diÃ¡rias

---

## DependÃªncias Completas

### Production
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "recharts": "^3.3.0",
  "@google/genai": "^1.27.0",
  "@supabase/supabase-js": "^2.x.x"
}
```

### Development
```json
{
  "@types/node": "^22.14.0",
  "@vitejs/plugin-react": "^5.0.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

### CDN (via importmap)
- React 19.2.0 (https://aistudiocdn.com/react@^19.2.0)
- React-DOM 19.2.0
- Recharts 3.3.0
- @google/genai 1.27.0
- TailwindCSS 3.x (via script tag)

---

## Contato e Suporte

**Desenvolvido com** utilizando:
- Google Gemini API (gemini-2.0-flash-exp)
- React 19
- TailwindCSS
- Vite

Para questÃµes sobre o **Gemini API**, consulte:
- [DocumentaÃ§Ã£o Oficial](https://ai.google.dev/docs)
- [AI Studio](https://ai.studio)

**RepositÃ³rio GitHub**: https://github.com/netsacolas/NutriMais.git

---

## LicenÃ§a

Projeto privado (`"private": true` em package.json).

---

**Ãšltima atualizaÃ§Ã£o**: 2025-10-26
**VersÃ£o**: 1.2.0 (PWA + Temporal Awareness)
**Funcionalidades**:
- âœ… Sistema completo de autenticaÃ§Ã£o (Supabase)
- âœ… Planejamento de refeiÃ§Ãµes com IA (Gemini)
- âœ… Painel de usuÃ¡rio com perfil e metas
- âœ… Registro e histÃ³rico de atividades fÃ­sicas
- âœ… HistÃ³rico de refeiÃ§Ãµes e pesagens
- âœ… Assistente nutricional com IA
- âœ… **ðŸ• ConsciÃªncia temporal (detecta manhÃ£/tarde/noite)**
- âœ… **SaudaÃ§Ãµes dinÃ¢micas baseadas no horÃ¡rio**
- âœ… **SugestÃµes de refeiÃ§Ãµes contextualizadas ao perÃ­odo do dia**
- âœ… Banco de 116 atividades fÃ­sicas
- âœ… CÃ¡lculo automÃ¡tico de calorias (MET values)
- âœ… GrÃ¡ficos de evoluÃ§Ã£o de peso
- âœ… Modal de confirmaÃ§Ã£o reutilizÃ¡vel
- âœ… **Progressive Web App (PWA)**
- âœ… **InstalÃ¡vel em mobile e desktop**
- âœ… **Funcionamento offline**
- âœ… **SincronizaÃ§Ã£o automÃ¡tica**
- âœ… **Cache inteligente de assets**
- âœ… **NotificaÃ§Ãµes de conexÃ£o**
- âœ… **AtualizaÃ§Ãµes automÃ¡ticas**

---

## ðŸ“± Progressive Web App (PWA)

### O que Ã© PWA?
Progressive Web App Ã© uma aplicaÃ§Ã£o web que se comporta como um aplicativo nativo, podendo ser instalada no dispositivo do usuÃ¡rio e funcionar offline.

### BenefÃ­cios do PWA NutriMais AI

**Para o UsuÃ¡rio**:
- ðŸ“¥ **InstalaÃ§Ã£o RÃ¡pida**: Um clique para adicionar Ã  tela inicial
- ðŸ“± **ExperiÃªncia Native**: Abre como app, sem barra do navegador
- âš¡ **Performance**: Carregamento instantÃ¢neo com cache
- ðŸ”Œ **Offline First**: Funciona sem internet apÃ³s primeira visita
- ðŸ”„ **Auto-Sync**: Dados sincronizam automaticamente quando conectar
- ðŸ’¾ **Armazenamento Local**: Nada Ã© perdido se ficar offline
- ðŸ”” **NotificaÃ§Ãµes**: Alertas de conexÃ£o e atualizaÃ§Ãµes
- ðŸ“Š **Economia de Dados**: Cache reduz consumo de internet

**Para o Desenvolvedor**:
- ðŸš€ **Deploy Ãšnico**: Sem necessidade de stores (App Store, Play Store)
- ðŸ”„ **AtualizaÃ§Ãµes InstantÃ¢neas**: Sem aguardar aprovaÃ§Ã£o
- ðŸ’° **Custo Zero**: Sem taxas de publicaÃ§Ã£o
- ðŸŒ **Cross-Platform**: Funciona em Android, iOS, Windows, Mac, Linux
- ðŸ“ˆ **SEO**: Ainda Ã© indexado por motores de busca
- ðŸ”§ **ManutenÃ§Ã£o Simples**: Um cÃ³digo para todas as plataformas

### Como Instalar o PWA

**Android (Chrome/Edge)**:
1. Abrir app no navegador
2. Banner "Instalar App" aparece automaticamente
3. Clicar em "Instalar" ou usar menu â‹® â†’ "Adicionar Ã  tela inicial"
4. App aparece na gaveta de aplicativos

**iOS (Safari)**:
1. Abrir app no Safari
2. Tocar no botÃ£o de compartilhar ðŸ“¤
3. Rolar e tocar em "Adicionar Ã  Tela de InÃ­cio"
4. Confirmar nome e tocar em "Adicionar"
5. App aparece na tela inicial

**Desktop (Chrome/Edge)**:
1. Abrir app no navegador
2. Clicar no Ã­cone de instalaÃ§Ã£o âŠ• na barra de endereÃ§o
3. Ou usar menu â‹® â†’ "Instalar NutriMais AI"
4. App abre em janela prÃ³pria

### Funcionalidades Offline

**O que funciona offline**:
- âœ… Visualizar histÃ³rico de refeiÃ§Ãµes jÃ¡ carregadas
- âœ… Visualizar histÃ³rico de peso
- âœ… Visualizar atividades fÃ­sicas registradas
- âœ… Visualizar perfil do usuÃ¡rio
- âœ… Navegar entre pÃ¡ginas jÃ¡ visitadas
- âœ… Interface completa carregada

**O que NÃƒO funciona offline** (Ã³bvio):
- âŒ Calcular novas refeiÃ§Ãµes (requer Gemini AI)
- âŒ Registrar novos dados (requer Supabase)
- âŒ Chat com assistente de IA
- âŒ Login/Cadastro de novos usuÃ¡rios

**SincronizaÃ§Ã£o AutomÃ¡tica**:
- Dados registrados offline ficam em fila
- Badge no canto superior direito mostra itens pendentes
- Quando conectar, sincroniza automaticamente
- BotÃ£o manual para forÃ§ar sincronizaÃ§Ã£o

### AtualizaÃ§Ãµes do App

**Como funciona**:
1. Nova versÃ£o Ã© detectada automaticamente
2. Banner azul aparece: "Nova versÃ£o disponÃ­vel"
3. Clicar em "Atualizar Agora"
4. App recarrega com nova versÃ£o
5. Nenhum dado Ã© perdido

**Quando atualizar**:
- Sempre que o banner aparecer
- Garante acesso Ã s Ãºltimas funcionalidades
- CorreÃ§Ãµes de bugs aplicadas imediatamente

### MÃ©tricas PWA

**Performance**:
- First Load: < 2s
- Repeat Visit: < 500ms (com cache)
- Offline: instantÃ¢neo (100% cache)

**Storage**:
- Cache total: ~15-20 MB
- Assets: ~5 MB
- Runtime cache: ~5 MB
- Images: ~5-10 MB
- Sync queue: < 100 KB

**Compatibilidade**:
- âœ… Chrome/Edge Android 5.0+ (100%)
- âœ… Safari iOS 11.3+ (90% - sem background sync)
- âœ… Chrome/Edge Desktop (100%)
- âœ… Firefox Desktop (95% - sem install prompt)
- âœ… Samsung Internet (100%)

### Troubleshooting PWA

**App nÃ£o oferece instalaÃ§Ã£o**:
- Verificar se estÃ¡ em HTTPS (localhost tambÃ©m funciona)
- Verificar se manifest.json estÃ¡ carregando
- Verificar console por erros do Service Worker
- Tentar em modo anÃ´nimo (limpa cache)

**App nÃ£o funciona offline**:
- Primeira visita precisa estar online
- Verificar se Service Worker foi registrado
- Console â†’ Application â†’ Service Workers
- Verificar se cache contÃ©m os assets

**SincronizaÃ§Ã£o nÃ£o funciona**:
- Verificar se estÃ¡ online de fato
- Clicar no botÃ£o "Sincronizar" manualmente
- Verificar console por erros de API
- Limpar fila: localStorage.removeItem('sync-queue')

**App desconfigurado apÃ³s instalar** (conhecido):
- Issue: TailwindCSS CDN pode nÃ£o carregar corretamente
- Workaround: Usar no navegador sem instalar
- Fix futuro: Migrar para TailwindCSS local

---

## ðŸ”’ Auditoria de SeguranÃ§a

### Status Geral de SeguranÃ§a
**Ãšltima auditoria**: 2025-10-25
**Status**: âš ï¸ **VULNERÃVEL - AÃ‡ÃƒO IMEDIATA NECESSÃRIA**
**Score de SeguranÃ§a**: ðŸ”´ **35/100**

### Resumo Executivo
A aplicaÃ§Ã£o possui **4 vulnerabilidades crÃ­ticas** e **5 de alta gravidade** que precisam de correÃ§Ã£o imediata antes de qualquer deploy em produÃ§Ã£o. Principais preocupaÃ§Ãµes:
- Credenciais expostas em repositÃ³rio pÃºblico
- Chaves de API acessÃ­veis no frontend
- AusÃªncia de validaÃ§Ã£o de inputs (risco XSS)
- NÃ£o conformidade com LGPD

### Vulnerabilidades CrÃ­ticas (CorreÃ§Ã£o Imediata) ðŸ”´

#### 1. Credenciais sensÃ­veis em `.env.local`
**Gravidade**: CRÃTICA
**SituaÃ§Ã£o atual**: o arquivo estÃ¡ no `.gitignore`, porÃ©m permanece no workspace com URL e anon key reais do Supabase, alÃ©m da `VITE_GEMINI_API_KEY` usada pelo fallback. Enquanto o fallback existir, a chave continuarÃ¡ embarcada no bundle.
**CorreÃ§Ã£o**:
- Rotacionar todas as credenciais expostas (Gemini, Supabase) e armazenÃ¡-las apenas nos Secrets do Supabase/CI.
- Manter apenas o fluxo via Edge Function e rotacionar as credenciais existentes no `.env.local`.
- Manter somente `.env.example` versionado com placeholders.

#### 2. Logs de debug ainda expÃµem dados em dev
**Gravidade**: CRÃTICA
**Arquivos**: `App.tsx`, `pages/PlanMealPage.tsx`, `pages/HistoryPage.tsx`, `public/sw.js`, entre outros.
**SituaÃ§Ã£o**: foi criado `utils/logger.ts` (silencia em produÃ§Ã£o), mas diversos `console.log`/`console.warn` continuam espalhados e imprimem dados nutricionais/diagnÃ³sticos no console do usuÃ¡rio.
**CorreÃ§Ã£o**: substituir por `logger` (com mascaramento) ou remover; garantir que build de produÃ§Ã£o continue removendo consoles (`terser drop_console`).

#### 3. API Gemini ainda acessÃ­vel no frontend (fallback)
**Gravidade**: CRÃTICA
**Arquivos**: `services/geminiDirect.ts`, `.env.local`
**SituaÃ§Ã£o**: Edge Function `gemini-proxy` estÃ¡ ativa, porÃ©m em erros 500 o frontend usa SDK direto com `VITE_GEMINI_API_KEY`, expondo a chave.

#### 4. ValidaÃ§Ã£o de entrada nÃ£o aplicada
**Gravidade**: CRÃTICA
**Arquivos**: `pages/AuthPage.tsx`, `pages/ProfilePage.tsx`, `pages/HealthPage.tsx`, `components/MealPlanner.tsx`
**SituaÃ§Ã£o**: `utils/validation.ts` contÃ©m schemas Zod, mas nenhum formulÃ¡rio usa `parse/safeParse`. Inputs continuam aceitando dados invÃ¡lidos (senhas curtas, valores negativos).
**CorreÃ§Ã£o**: integrar Zod em todos os fluxos de cadastro, perfil, metas e planner; exibir mensagens amigÃ¡veis na UI.

### Vulnerabilidades Altas (CorreÃ§Ã£o Urgente)

#### 5. Senha mÃ­nima fraca (6 caracteres)
**Arquivos**: `pages/AuthPage.tsx`, `components/UserPanel/ProfileModal.tsx`
**CorreÃ§Ã£o**: exigir â‰¥12 caracteres, incluir regras de complexidade e alinhar com schemas Zod.

#### 6. Sem confirmaÃ§Ã£o de e-mail obrigatÃ³ria
**Arquivos**: `authService.ts`
**SituaÃ§Ã£o**: mÃ©todo `signUp` envia `emailRedirectTo`, mas nÃ£o hÃ¡ verificaÃ§Ã£o no frontend nem obrigatoriedade no Supabase (precisa confirmar no painel).
**CorreÃ§Ã£o**: habilitar confirmaÃ§Ã£o de e-mail e bloquear login atÃ© verificaÃ§Ã£o.

#### 7. Tokens em `localStorage`
**Arquivos**: `supabaseClient.ts`
**CorreÃ§Ã£o**: migrar para cookies `httpOnly` (Supabase Auth helpers server-side) ou fortalecer mitigaÃ§Ã£o XSS.

### Melhorias jÃ¡ implementadas
- âœ… **Rate limiting**: Edge Function `gemini-proxy` registra uso na tabela `gemini_requests` (20 requisiÃ§Ãµes/hora por usuÃ¡rio). Verificar se migraÃ§Ãµes `005` e `007` foram executadas no projeto atual.
- âœ… **Headers de seguranÃ§a**: plugin `securityHeadersPlugin` em `vite.config.ts` adiciona CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy e HSTS (em produÃ§Ã£o). Revisar CSP depois de migrar Tailwind para build local para reduzir `unsafe-inline`.
### Conformidade Legal (LGPD) âš–ï¸

**Status**: ðŸ”´ **NÃƒO CONFORME**
**Risco**: Multa de atÃ© R$ 50 milhÃµes (dados de saÃºde sÃ£o sensÃ­veis)

**OBRIGATÃ“RIO para conformidade**:
- [ ] Criar PolÃ­tica de Privacidade
- [ ] Criar Termos de Uso
- [ ] Checkbox de consentimento no cadastro
- [ ] Funcionalidade "Exportar meus dados"
- [ ] Funcionalidade "Deletar minha conta"
- [ ] Informar quais dados sÃ£o coletados e por quÃª
- [ ] Informar compartilhamento com terceiros (Google, Supabase)

### Pontos Positivos âœ…

- Row Level Security (RLS) implementado corretamente
- PolÃ­ticas de acesso por usuÃ¡rio funcionando
- Zero vulnerabilidades em dependÃªncias npm
- Uso de TypeScript (type safety)
- Estrutura de cÃ³digo bem organizada
- HTTPS (assumindo deploy correto)

### Plano de AÃ§Ã£o Priorizado

**IMEDIATO (Hoje / Esta semana)**
1. Rotacionar credenciais expostas (`.env.local`) e manter apenas o fluxo via Edge Function.
2. Substituir `console.log`/`console.warn` por `logger` em pÃ¡ginas e serviÃ§os visÃ­veis ao usuÃ¡rio; garantir build sem consoles.
3. Integrar schemas Zod (`utils/validation.ts`) nos formulÃ¡rios de Auth, Perfil, SaÃºde e Planner com mensagens amigÃ¡veis.
4. Elevar requisitos de senha (â‰¥12 caracteres, complexidade) alinhando UI e Supabase Auth.
5. Redigir PolÃ­tica de Privacidade e Termos de Uso + incluir consentimento expresso no cadastro (LGPD).

**URGENTE (PrÃ³ximas 2 semanas)**
6. Habilitar confirmaÃ§Ã£o obrigatÃ³ria de e-mail no Supabase e bloquear login atÃ© verificaÃ§Ã£o.
7. Planejar migraÃ§Ã£o do armazenamento de sessÃ£o para cookies `httpOnly` ou outra mitigaÃ§Ã£o robusta contra XSS.
8. Implementar funcionalidades â€œExportar meus dadosâ€ e â€œDeletar minha contaâ€.

**IMPORTANTE (PrÃ³ximo mÃªs)**
9. Migrar favoritos e demais caches sensÃ­veis do `localStorage` para Supabase (com RLS).
10. Adicionar timeouts e retry controlado nas chamadas Supabase/Gemini + tratamento de erro padronizado.
11. Implementar proteÃ§Ã£o CSRF explÃ­cita (cookies + double submit ou tokens anti-CSRF) caso fluxos passem para POST backend.
12. Migrar Tailwind para build local e revisar CSP removendo `unsafe-inline`.
### Recursos de SeguranÃ§a

**Bibliotecas Recomendadas**:
- `zod` - ValidaÃ§Ã£o de schemas
- `dompurify` - SanitizaÃ§Ã£o de HTML
- `helmet` - Headers de seguranÃ§a (se usar backend Node)

**ServiÃ§os Recomendados**:
- Sentry - Monitoramento de erros
- Cloudflare - WAF e rate limiting
- LogRocket - Replay de sessÃµes

**DocumentaÃ§Ã£o**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/auth-helpers)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Checklist de SeguranÃ§a

**Antes de ProduÃ§Ã£o**:
- [ ] Credenciais rotacionadas e `.env.local` sanitizado
- [ ] Logs sensÃ­veis substituÃ­dos por `logger` (sem `console.*` no bundle)
- [ ] ValidaÃ§Ã£o Zod aplicada a todos os formulÃ¡rios crÃ­ticos
- [x] API Gemini via backend proxy (Supabase Edge Function `gemini-proxy`)
- [x] Rate limiting ativo (tabela `gemini_requests`, 20 req/h)
- [x] Headers de seguranÃ§a configurados (plugin `securityHeadersPlugin`)
- [ ] PolÃ­tica de Privacidade publicada
- [ ] Termos de Uso publicados
- [ ] Senha mÃ­nima â‰¥ 12 caracteres + complexidade
- [ ] ConfirmaÃ§Ã£o de e-mail obrigatÃ³ria ativa
- [ ] Exportar / Deletar dados implementados (LGPD)

**ObservaÃ§Ã£o**: `.env.local` estÃ¡ ignorado, mas contÃ©m chaves reais; manter fora do repositÃ³rio e distribuir via Secrets.

**Monitoramento ContÃ­nuo**:
- [ ] npm audit mensal
- [ ] Logs de seguranÃ§a no Supabase
- [ ] Alertas de tentativas de acesso suspeitas
- [ ] RevisÃ£o de polÃ­ticas RLS trimestral

------

## ðŸ“Š MÃ©tricas de Qualidade

### SeguranÃ§a
- **Score Atual**: 35/100 (VULNERÃVEL)
- **Score ApÃ³s CorreÃ§Ãµes CrÃ­ticas**: 60/100 (ACEITÃVEL)
- **Score ApÃ³s Todas CorreÃ§Ãµes**: 95/100 (EXCELENTE)

### DependÃªncias
- **Vulnerabilidades npm**: 0 (EXCELENTE)
- **DependÃªncias Desatualizadas**: Verificar com `npm outdated`

### Conformidade
- **LGPD**: NÃƒO CONFORME
- **OWASP Top 10**: 4/10 vulnerabilidades presentes

### Testes
- **Cobertura**: 0% (sem testes implementados)
- **Testes E2E**: Nenhum
- **Testes de SeguranÃ§a**: Auditoria manual realizada

**RecomendaÃ§Ã£o**: Implementar testes automatizados com Vitest/Jest antes de produÃ§Ã£o



