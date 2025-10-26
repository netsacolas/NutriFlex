# NutriMais AI - Documentação Técnica

## Visão Geral

**NutriMais AI** é uma aplicação web inteligente de diário alimentar que simplifica o planejamento nutricional. Os usuários definem suas metas de calorias para cada refeição, escolhem os alimentos desejados, e a IA calcula automaticamente as porções ideais para atingir uma dieta balanceada com distribuição de macronutrientes 40% carboidratos, 30% proteína e 30% gordura.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
- **Repository**: https://github.com/netsacolas/NutriMais.git
- **Repository Banner**: ![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## Stack Tecnológica

### Frontend
- **React 19.2.0** - Biblioteca UI com componentes funcionais e hooks
- **TypeScript 5.8.2** - Type safety e desenvolvimento robusto
- **Vite 6.2.0** - Build tool e dev server de alta performance
- **TailwindCSS** (via CDN) - Estilização utility-first com tema customizado

### Bibliotecas
- **Recharts 3.3.0** - Visualização de dados (gráficos de pizza para macronutrientes)
- **@google/genai 1.27.0** - SDK oficial do Google Gemini AI

### Backend & Infraestrutura
- **Supabase** - Backend as a Service (autenticação, banco de dados PostgreSQL)
- **Gemini 2.0 Flash Experimental** - Modelo de IA para cálculos nutricionais
- **AI Studio CDN** - Hosting de dependências via importmap

---

## Arquitetura do Projeto

```
NutriMais/
├── index.html                          # Entry point HTML com config Tailwind
├── index.tsx                           # Entry point React + root render
├── App.tsx                             # Componente principal da aplicação
├── types.ts                            # Definições TypeScript compartilhadas
├── vite.config.ts                     # Configuração Vite + env vars
├── tsconfig.json                      # Configuração TypeScript
├── package.json                       # Dependências e scripts
├── metadata.json                      # Metadados da aplicação
├── .env.local                         # Variáveis de ambiente (não commitado)
├── components/
│   ├── MealPlanner.tsx                # Interface de planejamento de refeições
│   ├── MealResult.tsx                 # Exibição de resultados + edição interativa
│   ├── icons.tsx                      # Ícones SVG customizados
│   ├── LoginForm.tsx                  # Formulário de login/cadastro
│   ├── ConfirmDeleteModal.tsx         # Modal de confirmação de exclusão (reutilizável)
│   └── UserPanel/
│       ├── UserPanel.tsx              # Painel principal do usuário
│       ├── ProfileModal.tsx           # Modal de edição de perfil
│       ├── HealthModal.tsx            # Modal de saúde, metas de calorias e atividades
│       ├── HistoryModal.tsx           # Modal de histórico (refeições, atividades, pesagens)
│       ├── ActivityHistory.tsx        # Componente de histórico de atividades (resumido)
│       ├── PhysicalActivityHistory.tsx # Histórico completo de atividades físicas
│       ├── MealHistory.tsx            # Histórico de refeições consumidas
│       ├── WeightHistory.tsx          # Histórico de pesagens com gráfico
│       └── NutritionChat.tsx          # Chat com assistente de IA nutricional
├── services/
│   ├── geminiService.ts               # Integração com Gemini API
│   ├── supabaseClient.ts              # Cliente Supabase configurado
│   ├── authService.ts                 # Serviços de autenticação
│   ├── profileService.ts              # CRUD de perfil do usuário
│   ├── mealHistoryService.ts          # CRUD de histórico de refeições
│   ├── weightHistoryService.ts        # CRUD de histórico de peso
│   └── physicalActivityService.ts     # CRUD de atividades físicas
├── data/
│   └── activitiesDatabase.ts          # Banco de dados de atividades físicas com MET values
├── utils/
│   └── bmiUtils.ts                    # Cálculos e classificação de IMC
└── migrations/                        # Migrações SQL do Supabase
    ├── 001_initial_schema.sql
    ├── 002_add_meal_history.sql
    ├── 003_add_weight_history.sql
    └── 004_add_physical_activities_and_meal_goals.sql
```

---

## Componentes Principais

### 1. App.tsx
[App.tsx](App.tsx)

**Responsabilidade**: Orquestrador principal da aplicação.

**Estado Gerenciado**:
- `mealResult`: Resultado do cálculo nutricional da IA
- `isLoading`: Estado de carregamento durante requisições
- `error`: Mensagens de erro para feedback ao usuário

**Fluxo de Dados**:
```
User Input (MealPlanner) → handleCalculate →
calculateMealPortions (Gemini API) →
MealResult Display
```

**Features**:
- Header responsivo com gradiente de marca
- Tratamento de erros com feedback visual
- Loading states durante processamento
- Footer com branding

---

### 2. MealPlanner.tsx
[components/MealPlanner.tsx](components/MealPlanner.tsx)

**Responsabilidade**: Interface para configuração de refeições.

**Funcionalidades**:

#### Gerenciamento de Refeições
- **Tipos de refeição**: Café da manhã, Almoço, Jantar, Lanche
- **Meta de calorias**: Input numérico configurável
- **Lista de alimentos**: Sistema de tags com adicionar/remover

#### Sistema de Favoritos
- Persistência em `localStorage`
- Toggle de favoritos por alimento (ícone de estrela)
- Quick add de favoritos à refeição atual
- Sincronização automática entre favoritos e selecionados

#### UX/UI
- Validação de duplicatas (case-insensitive)
- Animações fade-in para feedback visual
- Botão de cálculo com estados loading/disabled
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

**Responsabilidade**: Visualização e edição de resultados nutricionais.

**Features Principais**:

#### Edição Interativa de Porções
- **Ajuste em tempo real**: Inputs numéricos para gramas de cada alimento
- **Estado separado para inputs**: `inputValues` Map permite campo vazio durante edição
- **Recálculo automático**:
  - Cálculos sempre baseados em valores originais (não compostos)
  - Calorias proporcionais
  - Macros (proteína, carboidratos, gorduras, fibras)
  - Índice glicêmico ponderado
  - Carga glicêmica total
  - Totais da refeição
- **Validação inteligente**:
  - Permite apagar completamente o valor durante edição
  - Restaura valor automaticamente no onBlur se vazio
  - Aceita valor 0 para "remover" alimento temporariamente

**Algoritmo de Recálculo**:
```typescript
// Sempre calcula do ORIGINAL, não do editado
ratio = newGrams / originalPortion.grams
newCalories = originalPortion.calories * ratio
newMacro = originalPortion.macros * ratio

// Índice glicêmico ponderado pelos carboidratos
weightedGI = Σ(GI_alimento × (carbs_alimento / total_carbs))

// Carga glicêmica
glycemicLoad = (weightedGI × total_carbs) / 100
```

#### Visualização de Dados

**MacroChart Component**:
- Gráfico de pizza (donut chart) com Recharts
- Conversão de macros para calorias:
  - Carboidratos: 4 kcal/g
  - Proteínas: 4 kcal/g
  - Gorduras: 9 kcal/g
- **Total de calorias passado como prop** (evita erros de arredondamento)
- Tooltip customizado com tema dark
- Centro do donut mostra total exato de calorias
- Legendas com percentuais calculados dinamicamente

**Cards Informativos**:
- Grid responsivo de macronutrientes
- Fibras totais recalculadas proporcionalmente
- Índice glicêmico médio ponderado
- Carga glicêmica atualizada

#### Sugestões da IA
- Lista de dicas nutricionais personalizadas geradas pelo Gemini
- Ícones de check para melhor legibilidade
- Condicional (só exibe se houver sugestões)

---

### 4. geminiService.ts
[services/geminiService.ts](services/geminiService.ts)

**Responsabilidade**: Comunicação com Google Gemini API.

#### Configuração

```typescript
Model: gemini-2.0-flash-exp
Response Format: application/json
Temperature: 0.7
TopP: 0.8
MaxOutputTokens: 2048
```

#### Distribuição de Macronutrientes

**Regra Fundamental - 40/30/30**:
A IA ajusta as PORÇÕES (em gramas) de cada alimento para que a SOMA dos macros atinja:
- **40% Carboidratos**: `(targetCalories × 0.40) / 4` gramas
- **30% Proteína**: `(targetCalories × 0.30) / 4` gramas
- **30% Gordura**: `(targetCalories × 0.30) / 9` gramas

**Exemplo com 600 kcal**:
- Carboidratos: 60g (240 kcal = 40%)
- Proteína: 45g (180 kcal = 30%)
- Gordura: 20g (180 kcal = 30%)

#### Prompt Engineering

O serviço envia um prompt estruturado que:
1. Calcula metas exatas de macros em gramas
2. Instrui a IA a ajustar PORÇÕES para que a SOMA atinja as metas
3. Fornece processo passo-a-passo de cálculo
4. Inclui exemplo concreto de verificação
5. Solicita análise nutricional completa
6. Pede sugestões personalizadas baseadas nos alimentos específicos

#### System Instruction

Persona de nutricionista especialista com instruções para:
- Distribuição obrigatória 40/30/30
- Processo iterativo de ajuste de porções
- Verificação que soma dos macros = metas
- Exemplo detalhado com cálculos
- Análise nutricional completa (IG, CG, fibras)
- Sugestões totalmente personalizadas (não genéricas)
- Respostas sempre em português brasileiro
- Medidas caseiras brasileiras

#### Response Schema (Typed)

```typescript
{
  totalCalories: number
  totalMacros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  glycemicData: {
    index: number  // IG médio ponderado
    load: number   // Carga glicêmica total
  }
  portions: Portion[] {
    foodName: string
    grams: number
    homeMeasure: string  // Ex: "1 colher de sopa", "2 filés médios"
    calories: number
    macros: {
      protein: number
      carbs: number
      fat: number
      fiber: number
    }
    glycemicIndex: number
  }
  suggestions: string[]  // Dicas personalizadas
}
```

#### Tratamento de Erros
- Try-catch para falhas de rede/API
- Logging de erros no console
- Mensagens user-friendly propagadas para UI

#### Segurança
- API Key via variável de ambiente (`VITE_GEMINI_API_KEY`)
- Validação usando import.meta.env (Vite)
- Warning no console se API key não configurada
- Validação de JSON response

---

## Sistema de Usuário e Backend (Supabase)

### 5. Autenticação e Perfil de Usuário

**Serviços Backend**:
- [authService.ts](services/authService.ts) - Login, cadastro, logout, recuperação de sessão
- [profileService.ts](services/profileService.ts) - CRUD de perfil do usuário
- [supabaseClient.ts](services/supabaseClient.ts) - Cliente configurado do Supabase

**Funcionalidades de Autenticação**:
```typescript
// Login com email/senha
await authService.signIn(email, password)

// Cadastro de novo usuário
await authService.signUp(email, password)

// Logout
await authService.signOut()

// Recuperar sessão (ao recarregar página)
await authService.getCurrentSession()
```

**Perfil de Usuário**:
```typescript
interface UserProfile {
  id: string
  email: string
  weight?: number
  height?: number
  age?: number
  gender?: 'male' | 'female'
  meals_per_day?: number
  breakfast_calories?: number
  lunch_calories?: number
  dinner_calories?: number
  snack_calories?: number
  created_at: string
  updated_at: string
}
```

**Componentes**:
- [LoginForm.tsx](components/LoginForm.tsx) - Tela de login/cadastro com tabs
- [UserPanel.tsx](components/UserPanel/UserPanel.tsx) - Painel do usuário com botões de ação
- [ProfileModal.tsx](components/UserPanel/ProfileModal.tsx) - Edição de perfil e alteração de senha

---

### 6. HealthModal - Saúde, Metas e Atividades Físicas
[components/UserPanel/HealthModal.tsx](components/UserPanel/HealthModal.tsx)

**Responsabilidade**: Gerenciar dados de saúde, metas de calorias e registro de atividades físicas.

**Seções Principais**:

#### 6.1 Dados Básicos
- Peso (kg), Altura (cm), Idade, Sexo
- Cálculo automático de IMC com classificação colorida
- Cores dinâmicas baseadas na classificação (verde, amarelo, laranja, vermelho)

#### 6.2 Metas de Calorias
- **Refeições por dia**: Configurável (1-6)
- **Calorias por refeição**:
  - ☀️ Café da manhã
  - 🍽️ Almoço
  - 🌙 Jantar
  - 🍪 Lanche
- **Quantidade de lanches**: Campo numérico (1, 2, 3, 4+)
- **Total diário**: Calculado automaticamente incluindo `snack_calories × snackQuantity`

**Exemplo de cálculo**:
```typescript
Total = breakfast_calories + lunch_calories + dinner_calories + (snack_calories × snackQuantity)
// Ex: 400 + 600 + 600 + (200 × 3) = 2200 kcal/dia
```

#### 6.3 Registro de Atividades Físicas
- **Autocomplete de atividades**: Busca em banco com 100+ atividades
- **Banco de dados de atividades**: [activitiesDatabase.ts](data/activitiesDatabase.ts)
- **Cálculo automático de calorias**: Baseado em MET values
- **Fórmula de calorias queimadas**:
  ```typescript
  calories = MET × weight(kg) × time(hours)
  ```
- **Campos**:
  - Tipo de atividade (com autocomplete)
  - Duração (minutos)
  - Calorias queimadas (calculado automaticamente)

**MET Values (Metabolic Equivalent of Task)**:
- Caminhada leve: 3.5 MET
- Corrida (8 km/h): 8.0 MET
- Natação moderada: 5.8 MET
- Ciclismo (20 km/h): 8.0 MET
- Musculação: 6.0 MET

**Categorias de Atividades**:
- Caminhada e Corrida (10+ variações)
- Ciclismo (6 variações)
- Natação (5 variações)
- Esportes Coletivos (15+)
- Musculação e Academia (10+)
- Atividades Domésticas (20+)
- Dança (8 variações)
- Artes Marciais (10+)
- E muito mais...

#### 6.4 Histórico de Atividades
- Componente colapsável com últimas atividades
- [ActivityHistory.tsx](components/UserPanel/ActivityHistory.tsx) - Visualização resumida
- Exibição de atividade, duração e calorias
- Botão para expandir histórico completo

#### 6.5 Assistente de IA
- Botão com gradiente roxo-rosa chamativo
- Abre chat nutricional com contexto do perfil
- Sugestões personalizadas baseadas em dados do usuário

---

### 7. HistoryModal - Histórico Completo
[components/UserPanel/HistoryModal.tsx](components/UserPanel/HistoryModal.tsx)

**Responsabilidade**: Visualizar histórico de refeições, atividades físicas e pesagens.

**Sistema de Abas**:
```typescript
type HistoryTab = 'meals' | 'activities' | 'weight'
```

#### 7.1 Aba: Refeições
[components/UserPanel/MealHistory.tsx](components/UserPanel/MealHistory.tsx)

**Features**:
- Filtros: Última Semana | Último Mês | Tudo
- Cards com detalhes de cada refeição:
  - Tipo de refeição (ícone + nome)
  - Alimentos consumidos
  - Calorias totais
  - Macronutrientes (proteína, carboidratos, gorduras, fibras)
  - Data e hora
- Estatísticas:
  - Total de refeições registradas
  - Total de calorias consumidas
  - Média de calorias por refeição
- **Exclusão com confirmação**: Modal de confirmação antes de deletar

#### 7.2 Aba: Atividades
[components/UserPanel/PhysicalActivityHistory.tsx](components/UserPanel/PhysicalActivityHistory.tsx)

**Features**:
- Filtros temporais (semana, mês, tudo)
- Cards detalhados de atividades:
  - Nome da atividade
  - Duração (minutos)
  - Calorias queimadas
  - Data e hora
- Estatísticas:
  - Total de atividades realizadas
  - Total de calorias queimadas
  - Total de minutos de exercício
- Exclusão com modal de confirmação

#### 7.3 Aba: Pesagens
[components/UserPanel/WeightHistory.tsx](components/UserPanel/WeightHistory.tsx)

**Features**:
- Gráfico de linha com evolução do peso (Recharts)
- Lista de pesagens com:
  - Peso em kg
  - Data e hora
  - Variação em relação à pesagem anterior (↑ +1.5kg ou ↓ -2.0kg)
- Registro de novo peso
- Exclusão com confirmação
- Visualização de tendência (ganho/perda de peso)

#### 7.4 Assistente de IA no Histórico
- Botão idêntico ao HealthModal
- Contexto enriquecido com:
  - Dados do perfil
  - Histórico de refeições recentes
  - Histórico de peso
  - Atividades físicas

---

### 8. ConfirmDeleteModal - Modal de Confirmação
[components/ConfirmDeleteModal.tsx](components/ConfirmDeleteModal.tsx)

**Responsabilidade**: Modal reutilizável para confirmação de exclusões.

**Props**:
```typescript
interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string          // Ex: "Excluir Refeição?"
  message: string        // Ex: "Esta ação não pode ser desfeita."
  itemName?: string      // Ex: "Café da manhã - 400 kcal"
  isDeleting?: boolean   // Estado de loading durante exclusão
}
```

**Design**:
- Header vermelho-laranja (red-orange gradient)
- Backdrop escuro com blur (bg-black/70 backdrop-blur-sm)
- Z-index 60 (acima dos modais principais que usam z-50)
- Botões de ação: Cancelar (cinza) e Excluir (vermelho)
- Loading state no botão de exclusão

**Uso**:
```typescript
<ConfirmDeleteModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  title="Excluir Atividade?"
  message="Esta ação não pode ser desfeita."
  itemName={activityToDelete?.activity_type}
  isDeleting={isDeleting}
/>
```

---

### 9. NutritionChat - Assistente de IA Nutricional
[components/UserPanel/NutritionChat.tsx](components/UserPanel/NutritionChat.tsx)

**Responsabilidade**: Chat interativo com Gemini AI para orientação nutricional.

**Contexto Fornecido à IA**:
```typescript
interface ChatContext {
  profile?: UserProfile
  weightHistory?: WeightHistory[]
  recentMeals?: MealHistory[]
}
```

**Funcionalidades**:
- Histórico de mensagens (usuário e assistente)
- Streaming de respostas (digitação em tempo real)
- Contexto completo do usuário:
  - Dados pessoais (peso, altura, idade, sexo)
  - IMC calculado
  - Metas de calorias por refeição
  - Histórico de peso (últimos 10 registros)
  - Refeições recentes (últimos 20 registros)
- Sugestões personalizadas baseadas em dados reais
- Design com gradiente roxo-rosa no header

**Persona da IA**:
- Nutricionista especializado
- Linguagem acessível e amigável
- Respostas baseadas em evidências científicas
- Considera histórico e perfil do usuário
- Sugestões práticas e personalizadas

---

### 10. activitiesDatabase - Banco de Atividades Físicas
[data/activitiesDatabase.ts](data/activitiesDatabase.ts)

**Responsabilidade**: Banco de dados local com 100+ atividades físicas e valores MET.

**Estrutura de Dados**:
```typescript
interface ActivityData {
  name: string      // Ex: "Corrida - moderada (8 km/h)"
  met: number       // Ex: 8.0 (Metabolic Equivalent of Task)
  category: string  // Ex: "Corrida"
}
```

**Funções Principais**:

#### searchActivities(query: string, limit?: number)
- Busca fuzzy em nomes de atividades
- Case-insensitive
- Retorna array de nomes ordenados por relevância

#### getActivityMET(activityName: string)
- Busca exata do valor MET de uma atividade
- Retorna número ou undefined

#### calculateCaloriesBurned(met: number, weightKg: number, durationMinutes: number)
- Fórmula: `MET × weight(kg) × time(hours)`
- Retorna calorias arredondadas

**Categorias Incluídas**:
- Caminhada e Corrida (11 atividades)
- Ciclismo (6 atividades)
- Natação (5 atividades)
- Esportes Coletivos (16 atividades)
- Musculação e Academia (11 atividades)
- Yoga e Pilates (5 atividades)
- Dança (8 atividades)
- Artes Marciais (10 atividades)
- Atividades Domésticas (21 atividades)
- Jardinagem (5 atividades)
- Trabalho Manual (8 atividades)
- Recreação (10 atividades)

**Total**: 116 atividades diferentes

---

### 11. bmiUtils - Cálculos de IMC
[utils/bmiUtils.ts](utils/bmiUtils.ts)

**Responsabilidade**: Calcular e classificar Índice de Massa Corporal.

**Função Principal**:
```typescript
getBMIInfo(weight: number, height: number): BMIInfo

interface BMIInfo {
  value: number      // IMC calculado
  label: string      // Ex: "Peso Normal"
  color: string      // Cor da classificação (hex)
}
```

**Classificação OMS**:
- **Abaixo do peso** (< 18.5): #60a5fa (azul)
- **Peso normal** (18.5 - 24.9): #4ade80 (verde)
- **Sobrepeso** (25.0 - 29.9): #fbbf24 (amarelo)
- **Obesidade Grau I** (30.0 - 34.9): #fb923c (laranja)
- **Obesidade Grau II** (35.0 - 39.9): #f87171 (vermelho claro)
- **Obesidade Grau III** (≥ 40.0): #dc2626 (vermelho escuro)

**Fórmula**:
```typescript
BMI = weight(kg) / (height(m) × height(m))
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

// Porção individual de alimento
interface Portion extends MacroNutrients {
  foodName: string
  grams: number
  homeMeasure: string
  calories: number
  macros: MacroNutrients & { fiber?: number }
  glycemicIndex?: number
}

// Dados glicêmicos
interface GlycemicData {
  index: number  // Índice Glicêmico
  load: number   // Carga Glicêmica
}

// Resultado completo da refeição
interface MealResult {
  totalCalories: number
  totalMacros: MacroNutrients & { fiber: number }
  glycemicData: GlycemicData
  portions: Portion[]
  suggestions: string[]
}

// Tipos de refeição
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
```

---

## Configuração e Build

### Environment Variables

**.env.local** (não commitado no git):
```bash
# Gemini AI
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo

# Supabase
VITE_SUPABASE_URL=https://keawapzxqoyesptpwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Importante**: Vite usa o prefixo `VITE_` para expor variáveis ao client.

Acesso no código:
```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Vite Config
[vite.config.ts](vite.config.ts)

**Features**:
- **Dev Server**: Porta 3000 (com fallback automático), host 0.0.0.0 (acesso em rede)
- **Path Aliases**: `@/*` resolve para root do projeto
- **Plugin React**: JSX transform + Fast Refresh

### TypeScript Config
[tsconfig.json](tsconfig.json)

**Configurações Chave**:
- Target: ES2022
- Module: ESNext (para Vite)
- JSX: react-jsx (novo transform)
- Decorators experimentais habilitados
- Import de extensões .ts permitido
- No emit (Vite gerencia build)

---

## Design System (Tailwind)

### Paleta de Cores

**Backgrounds**:
- `primary-bg`: #1e1e1e (fundo principal)
- `secondary-bg`: #2d2d30 (cards secundários)
- `card-bg`: #252526 (cards principais)
- `hover-bg`: #3e3e42 (estados hover)

**Text**:
- `text-primary`: #cccccc
- `text-secondary`: #969696
- `text-muted`: #6b6b6b
- `text-bright`: #ffffff

**Accents**:
- `accent-orange`: #ff6b35 (primário)
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

### Animações

```javascript
fade-in: 0.5s ease-in-out
slide-up: 0.3s ease-out
pulse-soft: 2s infinite (hover em botões)
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
   └─> MealPlanner Component
       ├─> Seleciona tipo de refeição
       ├─> Define meta de calorias
       ├─> Adiciona alimentos
       └─> Clica "Calcular Porções Ideais"

2. API REQUEST
   └─> handleCalculate (App.tsx)
       └─> calculateMealPortions (geminiService.ts)
           ├─> Calcula metas de macros (40/30/30)
           ├─> Monta prompt estruturado com metas
           ├─> Envia para Gemini 2.0 Flash Exp
           └─> Recebe JSON estruturado

3. STATE UPDATE
   └─> setMealResult (App.tsx)
       └─> Passa para MealResultDisplay

4. RENDER & INTERACTION
   └─> MealResultDisplay Component
       ├─> Cria originalPortionsMap (useMemo)
       ├─> Inicializa inputValues (Map<string, string>)
       ├─> Exibe porções calculadas
       ├─> Renderiza MacroChart com totalCalories
       ├─> Permite edição de porções
       └─> Recalcula em tempo real do ORIGINAL
```

---

## Features Avançadas

### 1. Edição Interativa com State Derivado

O componente `MealResult` mantém três estados:
- **originalPortionsMap**: Map com dados puros da API (useMemo, para cálculos)
- **editedResult**: Dados atuais modificados pelo usuário
- **inputValues**: Map<string, string> com valores dos campos de texto

Benefícios:
- Cálculos sempre do original (evita composição de erros)
- Inputs podem ficar vazios durante edição
- Restauração automática no blur
- Otimização com useMemo

### 2. Recálculo Inteligente de Nutrientes

**Fibras**: Recalculadas proporcionalmente
```typescript
newFiber = originalFiber × (newGrams / originalGrams)
```

**Índice Glicêmico**: Média ponderada pelos carboidratos
```typescript
weightedGI = Σ(GI_i × carbs_i) / totalCarbs
```

**Carga Glicêmica**: Fórmula padrão
```typescript
GL = (GI × totalCarbs) / 100
```

### 3. Persistência Local

```typescript
localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods))
```

- Favoritos persistem entre sessões
- Parse com error handling (try-catch)
- Inicialização com fallback para array vazio

### 4. Responsividade

**Breakpoints Tailwind**:
- Mobile-first approach
- `md:` (768px+): Layouts side-by-side
- `lg:` (1024px+): Grid 5 colunas (3+2)

### 5. Validações

- Duplicatas de alimentos (case-insensitive)
- Valores numéricos mínimos (calorias > 0)
- Botão desabilitado sem alimentos selecionados
- Inputs com constraints (type="number", min="0")
- Validação de campo vazio durante edição

---

## Segurança e Boas Práticas

### Environment Variables
```bash
# .env.local (não commitado)
VITE_GEMINI_API_KEY=your_api_key_here
```

**IMPORTANTE**: Vite requer prefixo `VITE_` para expor ao client.

### Error Handling
- Try-catch em todas chamadas async
- Fallback messages user-friendly
- Console logging para debugging
- UI feedback para errors (toast vermelho)

### Type Safety
- Interfaces rígidas para API responses
- Type guards implícitos (TypeScript strict mode)
- Props tipadas em todos componentes
- Enums via union types (`MealType`)

### Accessibility
- Semantic HTML (`<label>`, `<form>`, `<button>`)
- ARIA labels para inputs (`aria-label`)
- Keyboard navigation support
- Focus states visíveis (`:focus` rings)

---

## Scripts de Desenvolvimento

```json
{
  "dev": "vite",           // Dev server (porta 3000+)
  "build": "vite build",   // Build de produção
  "preview": "vite preview" // Preview do build
}
```

### Instalação e Execução

```bash
# 1. Clonar repositório
git clone https://github.com/netsacolas/NutriMais.git
cd NutriMais

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar .env.local na raiz com:
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 4. Configurar Supabase
# Executar as migrações SQL no painel do Supabase:
# - migrations/001_initial_schema.sql
# - migrations/002_add_meal_history.sql
# - migrations/003_add_weight_history.sql
# - migrations/004_add_physical_activities_and_meal_goals.sql

# 5. Rodar desenvolvimento
npm run dev

# Acesso: http://localhost:3000 (ou próxima porta disponível)
```

### Configuração do Supabase

1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Executar as migrações SQL (pasta migrations/) no SQL Editor do Supabase
4. Copiar URL do projeto e Anon Key para .env.local
5. Habilitar autenticação por email no painel Authentication

---

## Performance e Otimizações

### Bundle Size
- React 19.2.0 via CDN (não empacotado)
- Recharts 3.3.0 via CDN
- TailwindCSS via CDN (zero build overhead)
- Código principal < 50KB (minified)

### Runtime Optimizations
- `useCallback` para prevenir re-renders
- `useMemo` para cálculos pesados (originalPortionsMap, chartData)
- `useState` batching automático (React 19)
- Conditional rendering (`&&`, ternários)
- Map para lookups O(1) vs array O(n)

### Network
- API calls debounced (via user action, não auto-trigger)
- JSON response schema para respostas concisas
- CDN caching para dependencies
- Model otimizado: gemini-2.0-flash-exp

---

## Histórico de Alterações

### Commit atual (2025-10-25)
**Sistema completo de usuário, atividades físicas e históricos**

- **Sistema de autenticação com Supabase**:
  - Login e cadastro de usuários
  - Recuperação de sessão
  - Perfil de usuário com dados pessoais e metas de calorias

- **Painel de Usuário completo**:
  - UserPanel com botões de ação (Perfil, Saúde, Histórico, Sair)
  - ProfileModal para edição de perfil e senha
  - HealthModal com dados de saúde, metas e atividades
  - HistoryModal com 3 abas (Refeições, Atividades, Pesagens)

- **Sistema de Atividades Físicas**:
  - Banco de dados com 116 atividades e valores MET
  - Autocomplete para seleção de atividades
  - Cálculo automático de calorias queimadas
  - Histórico completo de atividades
  - Estatísticas (total atividades, calorias, minutos)

- **Metas de Calorias**:
  - Configuração de calorias por refeição (café, almoço, jantar, lanche)
  - **Campo quantidade de lanches**: Multiplicador simples (input numérico)
  - Cálculo automático de total diário
  - Integração com MealPlanner (auto-população de metas)

- **Histórico de Refeições**:
  - Armazenamento de refeições planejadas
  - Visualização com filtros (semana, mês, tudo)
  - Estatísticas de consumo
  - Cards detalhados com macros

- **Histórico de Peso**:
  - Registro de pesagens
  - Gráfico de evolução (Recharts)
  - Cálculo de variações
  - Tendências de ganho/perda

- **Assistente de IA Nutricional**:
  - Chat interativo com Gemini AI
  - Contexto completo do usuário
  - Sugestões personalizadas
  - Botão com gradiente roxo-rosa destacado

- **Modal de Confirmação**:
  - Componente ConfirmDeleteModal reutilizável
  - Design com header vermelho-laranja
  - Estados de loading
  - Z-index correto (60 sobre modais principais)

- **Melhorias de UX/UI**:
  - Backdrop escuro com blur (bg-black/70 backdrop-blur-sm)
  - Botão AI Assistant mais visível
  - IMC com cores dinâmicas
  - Animações e transições suaves

### Commit 0ca0178 (2025-10-25)
**Atualizar distribuição de macros para 40/30/30 e corrigir edição de porções**

- **Distribuição de macronutrientes alterada**:
  - 40% carboidratos (antes 34%)
  - 30% proteína (antes 33%)
  - 30% gordura (antes 33%)

- **Bug fix: Edição de porções**:
  - Adicionado estado `inputValues` separado
  - Permite apagar primeiro dígito sem bloquear
  - Campo pode ficar vazio durante edição
  - Restauração automática no onBlur

- **Melhorias no cálculo pela IA**:
  - Prompt atualizado com distribuição 40/30/30
  - Exemplos detalhados no system instruction
  - Remoção de console.logs desnecessários

### Commit 9a8b066 (anterior)
- Correção de bug: Chart mostrando total diferente da soma
- Fix: Recálculo baseado em valores originais (não compostos)
- Implementação de fibras e índice glicêmico dinâmicos

### Commit fc2278e (inicial)
- Setup inicial do projeto
- Integração com Gemini AI
- Distribuição 33/33/34
- Sistema de favoritos
- Edição básica de porções

---

## Problemas Resolvidos

### 1. Environment Variables (Vite)
**Problema**: Erro "API key not valid"
**Causa**: Usando `process.env.API_KEY` em vez de `import.meta.env.VITE_GEMINI_API_KEY`
**Solução**: Alterar para sintaxe Vite com prefixo `VITE_`

### 2. Recálculo de Porções Incorreto
**Problema**: Aumentar porção diminuía calorias totais
**Causa**: Cálculo baseado em valores já editados (composição de erros)
**Solução**: Sempre calcular do `originalPortionsMap` usando useMemo

### 3. Chart com Total Diferente
**Problema**: Chart mostrava 555 kcal mas porções somavam 548 kcal
**Causa**: Erros de arredondamento ao calcular total internamente
**Solução**: Passar `totalCalories` como prop para o MacroChart

### 4. Fibras e IG não Atualizavam
**Problema**: Valores ficavam fixos como "(original)"
**Causa**: Não estavam sendo recalculados dinamicamente
**Solução**: Implementar recálculo proporcional de fibras e IG ponderado

### 5. Impossível Apagar Primeiro Dígito
**Problema**: Não conseguia apagar completamente o valor do input
**Causa**: Handler bloqueava quando `newGramsStr === ''`
**Solução**: Estado separado `inputValues` permite vazio, com restauração no onBlur

### 6. Distribuição de Macros Incorreta
**Problema**: AI distribuía totalMacros em 1/3, mas porções não somavam corretamente
**Causa**: Instruções ambíguas no prompt
**Solução**: Calcular metas exatas em gramas, fornecer exemplo detalhado, enfatizar SOMA

### 7. Design Quebrado do Campo de Lanches
**Problema**: Botões +/− com "3x" quebravam o layout do campo de lanche
**Causa**: Excesso de elementos inline no mesmo container
**Solução**: Separar em dois campos distintos:
  - Campo de calorias do lanche (200 kcal)
  - Campo de quantidade de lanches (1, 2, 3, 4+)
  - Layout limpo e simples com input type="number"

---

## Possíveis Melhorias Futuras

### Features
1. ✅ ~~**Histórico de Refeições**~~ - Implementado com Supabase
2. ✅ ~~**Autenticação**~~ - Implementado com Supabase
3. ✅ ~~**Histórico de Peso**~~ - Implementado com gráfico de evolução
4. ✅ ~~**Atividades Físicas**~~ - Implementado com banco de 116 atividades
5. **Metas Diárias**: Dashboard com soma de múltiplas refeições e gráfico consolidado
6. **Exportação**: PDF ou imagem do plano nutricional
7. **Modo Offline**: Service Worker + Cache API para uso sem internet
8. **Banco de Alimentos**: Autocomplete com tabela TACO/USDA oficial
9. **Distribuição Customizável**: Permitir usuário ajustar % de macros (ex: 30/40/30)
10. **Metas de Macros**: Além de calorias, configurar gramas de proteína/carbs/gordura
11. **Receitas**: Salvar combinações de alimentos como receitas favoritas
12. **Planejamento Semanal**: Planejar refeições para a semana inteira
13. **Notificações**: Lembretes de refeições e registro de atividades

### Técnicas
1. **React Query**: Cache e sincronização de estado servidor
2. **Zod**: Validação runtime de schemas
3. **Vitest**: Testes unitários e integração
4. **PWA**: Manifest + Service Worker para instalação
5. **i18n**: Internacionalização (pt-BR, en-US, es-ES)
6. **Analytics**: Posthog ou Google Analytics

### UX
1. **Dark/Light Mode Toggle**: Preferência de tema persistida
2. **Drag & Drop**: Reordenar alimentos na lista
3. **Sugestões Inteligentes**: Baseadas em histórico do usuário
4. **Comparação Nutricional**: Side-by-side de diferentes planos
5. **Notificações**: Lembretes de refeições (PWA)
6. **Calculadora de IMC/TMB**: Sugestão de calorias diárias

---

## Dependências Completas

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

Para questões sobre o **Gemini API**, consulte:
- [Documentação Oficial](https://ai.google.dev/docs)
- [AI Studio](https://ai.studio)

**Repositório GitHub**: https://github.com/netsacolas/NutriMais.git

---

## Licença

Projeto privado (`"private": true` em package.json).

---

**Última atualização**: 2025-10-25
**Versão**: 1.0.0
**Funcionalidades**:
- Sistema completo de autenticação (Supabase)
- Planejamento de refeições com IA (Gemini)
- Painel de usuário com perfil e metas
- Registro e histórico de atividades físicas
- Histórico de refeições e pesagens
- Assistente nutricional com IA
- Banco de 116 atividades físicas
- Cálculo automático de calorias (MET values)
- Gráficos de evolução de peso
- Modal de confirmação reutilizável

---

## 🔒 Auditoria de Segurança

### Status Geral de Segurança
**Última auditoria**: 2025-10-25
**Status**: ⚠️ **VULNERÁVEL - AÇÃO IMEDIATA NECESSÁRIA**
**Score de Segurança**: 🔴 **35/100**

### Resumo Executivo
A aplicação possui **4 vulnerabilidades críticas** e **5 de alta gravidade** que precisam de correção imediata antes de qualquer deploy em produção. Principais preocupações:
- Credenciais expostas em repositório público
- Chaves de API acessíveis no frontend
- Ausência de validação de inputs (risco XSS)
- Não conformidade com LGPD

### Vulnerabilidades Críticas (Correção Imediata) 🔴

#### 1. Exposição de Credenciais no .env.local
**Gravidade**: CRÍTICA
**Arquivo**: `.env.local` (linhas 1-5)
**Problema**: API keys do Google Gemini e credenciais Supabase expostas em texto puro
**Impacto**: Acesso total ao banco de dados, roubo de dados de usuários, custos financeiros na API
**Correção**:
- Adicionar `.env.local` ao `.gitignore` imediatamente
- Revogar e gerar novas chaves (Gemini + Supabase)
- Remover do histórico Git: `git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch .env.local" HEAD`
- Criar `.env.example` com placeholders

#### 2. Logs de Debug Expondo Dados em Produção
**Gravidade**: CRÍTICA
**Arquivos**: `supabaseClient.ts:7-12`, `MealPlanner.tsx:41-67`, e mais 15 arquivos
**Problema**: Console.log expõe credenciais parciais e dados pessoais visíveis no DevTools
**Impacto**: Vazamento de informações sensíveis, dados de saúde expostos
**Correção**:
```typescript
// Remover todos console.log de produção
// Criar serviço condicional:
const isDev = import.meta.env.DEV;
if (isDev) console.log(...);
```

#### 3. API Keys no Bundle do Frontend
**Gravidade**: CRÍTICA
**Arquivos**: `vite.config.ts:13-16`, `geminiService.ts:5`
**Problema**: Chave do Gemini exposta no código JavaScript do cliente
**Impacto**: Uso indevido da quota da API, custos financeiros ilimitados
**Correção**:
- Criar backend proxy (Supabase Edge Function)
- Mover chave API para servidor
- Frontend chama proxy, proxy chama Gemini

#### 4. Ausência Total de Validação de Input
**Gravidade**: CRÍTICA
**Arquivos**: `MealPlanner.tsx`, `ProfileModal.tsx`, `HealthModal.tsx`
**Problema**: Nenhum dado de usuário é validado ou sanitizado
**Impacto**: XSS, injection attacks, dados inválidos (peso negativo, etc)
**Correção**:
```bash
npm install zod
```
```typescript
import { z } from 'zod';

const profileSchema = z.object({
  weight: z.number().min(20).max(300),
  height: z.number().min(50).max(250),
  age: z.number().int().min(13).max(120),
  fullName: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
});
```

### Vulnerabilidades Altas (Correção Urgente) 🟠

#### 5. Senha Mínima Fraca (6 caracteres)
**Arquivo**: `ProfileModal.tsx:118-121`
**Correção**: Aumentar para mínimo 12 caracteres + complexidade

#### 6. Ausência de Rate Limiting
**Impacto**: Ataques de força bruta, abuso da API, custos
**Correção**: Configurar limites no Supabase/Cloudflare (5 logins/15min, 20 cálculos/hora)

#### 7. Sem Confirmação de Email
**Arquivo**: `authService.ts:11-27`
**Correção**: Ativar confirmação de email no Supabase

#### 8. Tokens em localStorage (vulnerável a XSS)
**Arquivo**: `supabaseClient.ts:19-24`
**Correção**: Migrar para cookies httpOnly ou garantir 100% proteção XSS

#### 9. Headers de Segurança HTTP Ausentes
**Arquivo**: `vite.config.ts`
**Correção**: Adicionar CSP, X-Frame-Options, X-Content-Type-Options, etc.

### Conformidade Legal (LGPD) ⚖️

**Status**: 🔴 **NÃO CONFORME**
**Risco**: Multa de até R$ 50 milhões (dados de saúde são sensíveis)

**OBRIGATÓRIO para conformidade**:
- [ ] Criar Política de Privacidade
- [ ] Criar Termos de Uso
- [ ] Checkbox de consentimento no cadastro
- [ ] Funcionalidade "Exportar meus dados"
- [ ] Funcionalidade "Deletar minha conta"
- [ ] Informar quais dados são coletados e por quê
- [ ] Informar compartilhamento com terceiros (Google, Supabase)

### Pontos Positivos ✅

- Row Level Security (RLS) implementado corretamente
- Políticas de acesso por usuário funcionando
- Zero vulnerabilidades em dependências npm
- Uso de TypeScript (type safety)
- Estrutura de código bem organizada
- HTTPS (assumindo deploy correto)

### Plano de Ação Priorizado

**⚡ IMEDIATO (Hoje/Esta Semana)**:
1. Proteger credenciais (revogar, adicionar ao .gitignore, remover do Git)
2. Remover logs de produção
3. Criar backend proxy para Gemini API
4. Implementar validação com Zod
5. Adicionar headers de segurança
6. Criar Política de Privacidade e Termos

**🔶 URGENTE (Próximas 2 Semanas)**:
7. Melhorar requisitos de senha (12+ caracteres)
8. Implementar rate limiting
9. Ativar confirmação de email
10. Adicionar "Exportar dados" e "Deletar conta" (LGPD)

**🟢 IMPORTANTE (Próximo Mês)**:
11. Migrar favoritos para banco de dados
12. Storage seguro para tokens (cookies httpOnly)
13. Timeout em requisições
14. Proteção CSRF explícita

### Recursos de Segurança

**Bibliotecas Recomendadas**:
- `zod` - Validação de schemas
- `dompurify` - Sanitização de HTML
- `helmet` - Headers de segurança (se usar backend Node)

**Serviços Recomendados**:
- Sentry - Monitoramento de erros
- Cloudflare - WAF e rate limiting
- LogRocket - Replay de sessões

**Documentação**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/auth-helpers)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Checklist de Segurança

**Antes de Produção**:
- [ ] .env.local no .gitignore
- [ ] Novas credenciais geradas
- [ ] Logs de debug removidos
- [ ] API Gemini via backend proxy
- [ ] Validação Zod em todos formulários
- [ ] Headers de segurança configurados
- [ ] Política de Privacidade publicada
- [ ] Termos de Uso publicados
- [ ] Senha mínima 12 caracteres
- [ ] Rate limiting ativo
- [ ] Confirmação de email ativa
- [ ] Exportar/Deletar dados implementado

**Monitoramento Contínuo**:
- [ ] npm audit mensal
- [ ] Logs de segurança no Supabase
- [ ] Alertas de tentativas de acesso suspeitas
- [ ] Revisão de políticas RLS trimestral

---

## 📊 Métricas de Qualidade

### Segurança
- **Score Atual**: 35/100 (VULNERÁVEL)
- **Score Após Correções Críticas**: 60/100 (ACEITÁVEL)
- **Score Após Todas Correções**: 95/100 (EXCELENTE)

### Dependências
- **Vulnerabilidades npm**: 0 (EXCELENTE)
- **Dependências Desatualizadas**: Verificar com `npm outdated`

### Conformidade
- **LGPD**: NÃO CONFORME
- **OWASP Top 10**: 4/10 vulnerabilidades presentes

### Testes
- **Cobertura**: 0% (sem testes implementados)
- **Testes E2E**: Nenhum
- **Testes de Segurança**: Auditoria manual realizada

**Recomendação**: Implementar testes automatizados com Vitest/Jest antes de produção
