# NutriFlex AI - Documentação Técnica

## Visão Geral

**NutriFlex AI** é uma aplicação web inteligente de diário alimentar que simplifica o planejamento nutricional. Os usuários definem suas metas de calorias para cada refeição, escolhem os alimentos desejados, e a IA calcula automaticamente as porções ideais para atingir uma dieta balanceada com distribuição de macronutrientes 40% carboidratos, 30% proteína e 30% gordura.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
- **Repository**: https://github.com/netsacolas/NutriFlex.git
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
- **Gemini 2.0 Flash Experimental** - Modelo de IA para cálculos nutricionais
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
├── .env.local                # Variáveis de ambiente (não commitado)
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
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
```

**Importante**: Vite usa o prefixo `VITE_` para expor variáveis ao client.

Acesso no código:
```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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
git clone https://github.com/netsacolas/NutriFlex.git
cd NutriFlex

# 2. Instalar dependências
npm install

# 3. Configurar API Key
# Criar .env.local na raiz:
VITE_GEMINI_API_KEY=your_key_here

# 4. Rodar desenvolvimento
npm run dev

# Acesso: http://localhost:3000 (ou próxima porta disponível)
```

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

---

## Possíveis Melhorias Futuras

### Features
1. **Histórico de Refeições**: Salvar planos anteriores no localStorage
2. **Metas Diárias**: Soma de múltiplas refeições com gráfico consolidado
3. **Exportação**: PDF ou imagem do plano nutricional
4. **Modo Offline**: Service Worker + Cache API
5. **Autenticação**: Perfis de usuário com Firebase/Supabase
6. **Banco de Alimentos**: Autocomplete com TACO/USDA
7. **Distribuição Customizável**: Permitir usuário ajustar % de macros

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

**Desenvolvido com** utilizando:
- Google Gemini API (gemini-2.0-flash-exp)
- React 19
- TailwindCSS
- Vite

Para questões sobre o **Gemini API**, consulte:
- [Documentação Oficial](https://ai.google.dev/docs)
- [AI Studio](https://ai.studio)

**Repositório GitHub**: https://github.com/netsacolas/NutriFlex.git

---

## Licença

Projeto privado (`"private": true` em package.json).

---

**Última atualização**: 2025-10-25
**Versão**: 0.0.0
**Último Commit**: 0ca0178 - Distribuição 40/30/30 + Fix edição de porções
