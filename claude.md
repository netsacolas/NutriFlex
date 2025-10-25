# NutriFlex AI - Documentação Técnica

## Visão Geral

**NutriFlex AI** é uma aplicação web inteligente de diário alimentar que simplifica o planejamento nutricional. Os usuários definem suas metas de calorias para cada refeição, escolhem os alimentos desejados, e a IA calcula automaticamente as porções ideais para atingir uma dieta balanceada.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
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

### Infraestrutura
- **Gemini 2.5 Flash** - Modelo de IA para cálculos nutricionais
- **AI Studio CDN** - Hosting de dependências via importmap

---

## Arquitetura do Projeto

```
NutriFlex/
├── index.html                 # Entry point HTML com config Tailwind
├── index.tsx                  # Entry point React + root render
├── App.tsx                    # Componente principal da aplicação
├── types.ts                   # Definições TypeScript compartilhadas
├── vite.config.ts            # Configuração Vite + env vars
├── tsconfig.json             # Configuração TypeScript
├── package.json              # Dependências e scripts
├── metadata.json             # Metadados da aplicação
├── components/
│   ├── MealPlanner.tsx       # Interface de planejamento de refeições
│   ├── MealResult.tsx        # Exibição de resultados + edição interativa
│   └── icons.tsx             # Ícones SVG customizados
└── services/
    └── geminiService.ts      # Integração com Gemini API
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
- **Recálculo automático**:
  - Calorias proporcionais
  - Macros (proteína, carboidratos, gorduras)
  - Totais da refeição
- **Preservação de dados**: Fibras e índice glicêmico mantêm valores originais

**Algoritmo de Recálculo**:
```typescript
ratio = newGrams / originalGrams
newCalories = originalCalories * ratio
newMacro = originalMacro * ratio
```

#### Visualização de Dados

**MacroChart Component**:
- Gráfico de pizza (donut chart) com Recharts
- Conversão de macros para calorias:
  - Carboidratos: 4 kcal/g
  - Proteínas: 4 kcal/g
  - Gorduras: 9 kcal/g
- Tooltip customizado com tema dark
- Centro do donut mostra total de calorias

**Cards Informativos**:
- Grid responsivo de macronutrientes
- Fibras totais (preservado do cálculo original)
- Índice glicêmico médio

#### Sugestões da IA
- Lista de dicas nutricionais geradas pelo Gemini
- Ícones de check para melhor legibilidade
- Condicional (só exibe se houver sugestões)

---

### 4. geminiService.ts
[services/geminiService.ts](services/geminiService.ts)

**Responsabilidade**: Comunicação com Google Gemini API.

#### Configuração

```typescript
Model: gemini-2.5-flash
Response Format: application/json
System Instruction: "Expert nutritionist persona"
```

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
    index: number  // IG médio
    load: number   // Carga glicêmica total
  }
  portions: Portion[] {
    foodName: string
    grams: number
    homeMeasure: string  // Ex: "1 colher de sopa", "2 filés pequenos"
    calories: number
    macros: { protein, carbs, fat }
  }
  suggestions: string[]  // Dicas de melhoria nutricional
}
```

#### Tratamento de Erros
- Try-catch para falhas de rede/API
- Logging de erros no console
- Mensagens user-friendly propagadas para UI

#### Segurança
- API Key via variável de ambiente (`GEMINI_API_KEY`)
- Fallback para placeholder (com warning no console)
- Validação de JSON response

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
  macros: MacroNutrients
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

### Vite Config
[vite.config.ts](vite.config.ts)

**Features**:
- **Dev Server**: Porta 3000, host 0.0.0.0 (acesso em rede)
- **Environment Variables**: Injeta `GEMINI_API_KEY` via `process.env`
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
- `protein`: #60a5fa (azul)
- `carbs`: #fbbf24 (amarelo)
- `fat`: #f87171 (vermelho)
- `fiber`: #4ade80 (verde)

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
           ├─> Monta prompt estruturado
           ├─> Envia para Gemini 2.5 Flash
           └─> Recebe JSON estruturado

3. STATE UPDATE
   └─> setMealResult (App.tsx)
       └─> Passa para MealResultDisplay

4. RENDER & INTERACTION
   └─> MealResultDisplay Component
       ├─> Exibe porções calculadas
       ├─> Renderiza MacroChart
       ├─> Permite edição de porções
       └─> Recalcula em tempo real
```

---

## Features Avançadas

### 1. Edição Interativa com State Derivado

O componente `MealResult` mantém dois estados:
- **Original**: Dados puros da API (para cálculos proporcionais)
- **Edited**: Dados atuais (modificados pelo usuário)

Uso de `useMemo` para memoização do map de porções originais, otimizando recálculos.

### 2. Persistência Local

```typescript
localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods))
```

- Favoritos persistem entre sessões
- Parse com error handling (try-catch)
- Inicialização com fallback para array vazio

### 3. Responsividade

**Breakpoints Tailwind**:
- Mobile-first approach
- `md:` (768px+): Layouts side-by-side
- `lg:` (1024px+): Grid 5 colunas (3+2)

### 4. Validações

- Duplicatas de alimentos (case-insensitive)
- Valores numéricos mínimos (calorias > 0)
- Botão desabilitado sem alimentos selecionados
- Inputs com constraints (type="number")

---

## Segurança e Boas Práticas

### Environment Variables
```bash
# .env.local (não commitado)
GEMINI_API_KEY=your_api_key_here
```

Injeção via Vite config:
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

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
  "dev": "vite",           // Dev server na porta 3000
  "build": "vite build",   // Build de produção
  "preview": "vite preview" // Preview do build
}
```

### Instalação e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Configurar API Key
# Criar .env.local na raiz:
GEMINI_API_KEY=your_key_here

# 3. Rodar desenvolvimento
npm run dev

# Acesso: http://localhost:3000
```

---

## Performance e Otimizações

### Bundle Size
- React 19.2.0 via CDN (não empacotado)
- Recharts 3.3.0 via CDN
- TailwindCSS via CDN (zero build overhead)
- Código principal < 50KB (minified)

### Runtime Optimizations
- `useCallback` para prevenir re-renders ([App.tsx:13](App.tsx#L13))
- `useMemo` para cálculos pesados ([MealResult.tsx:59](MealResult.tsx#L59))
- `useState` batching automático (React 19)
- Conditional rendering (`&&`, ternários)

### Network
- API calls debounced (via user action, não auto-trigger)
- JSON response schema para respostas concisas
- CDN caching para dependencies

---

## Possíveis Melhorias Futuras

### Features
1. **Histórico de Refeições**: Salvar planos anteriores
2. **Metas Diárias**: Soma de múltiplas refeições
3. **Exportação**: PDF ou imagem do plano
4. **Modo Offline**: Service Worker + Cache API
5. **Autenticação**: Perfis de usuário com Firebase
6. **Banco de Alimentos**: Autocomplete com TACO/USDA

### Técnicas
1. **React Query**: Cache e sincronização de estado servidor
2. **Zod**: Validação runtime de schemas
3. **Vitest**: Testes unitários e integração
4. **PWA**: Manifest + Service Worker
5. **i18n**: Internacionalização (pt-BR, en-US)
6. **Analytics**: Posthog ou Google Analytics

### UX
1. **Dark/Light Mode Toggle**: Preferência de tema
2. **Drag & Drop**: Reordenar alimentos
3. **Sugestões Inteligentes**: Baseadas em histórico
4. **Comparação Nutricional**: Side-by-side de planos
5. **Notificações**: Lembretes de refeições

---

## Dependências Completas

### Production
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "recharts": "^3.3.0",
  "@google/genai": "^1.27.0"
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

**Desenvolvido com paixão** utilizando:
- Google Gemini API
- React 19
- TailwindCSS
- Vite

Para questões sobre o **Gemini API**, consulte:
- [Documentação Oficial](https://ai.google.dev/docs)
- [AI Studio](https://ai.studio)

---

## Licença

Projeto privado (`"private": true` em package.json).

---

**Última atualização**: 2025-10-24
**Versão**: 0.0.0
