# NutriMais AI - Documentação Técnica Atualizada

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
- **React Router DOM 7.9.4** - Camada de roteamento com rotas públicas e protegidas
- **TypeScript 5.8.2** - Type safety e desenvolvimento robusto
- **Vite 6.2.0** - Build tool e dev server de alta performance
- **TailwindCSS 4.1.16** - Utility-first CSS (local + CDN)

### Bibliotecas
- **Recharts 3.3.0** - Visualização de dados (gráficos de pizza para macronutrientes)
- **@google/genai 1.27.0** - SDK oficial do Google Gemini AI (Edge Function)
- **@supabase/supabase-js 2.76.1** - Cliente Supabase para auth e database
- **Zod 4.1.12** - Schemas de validação centralizados em `utils/validation.ts`

### Backend & Infraestrutura
- **Supabase** - Backend as a Service (autenticação, banco de dados PostgreSQL, Edge Functions)
- **Gemini 2.0 Flash Experimental** - Modelo de IA para cálculos nutricionais
- **PostgreSQL** - Banco de dados relacional com Row Level Security (RLS)

---

## 🆕 Atualizações Recentes (Janeiro 2025)

### 1. Sistema de Onboarding Obrigatório
- **OnboardingPage.tsx**: Wizard de 5 passos para novos usuários
- Coleta dados essenciais: peso, altura, idade, sexo, nível de atividade, objetivos
- Cálculo automático de IMC em tempo real
- **IA calcula metas calóricas** personalizadas usando `calorieGoalService`
- Redirecionamento forçado até completar onboarding
- Encoding UTF-8 corrigido em todos os arquivos

### 2. Sistema Completo de Hidratação
- **HydrationPage.tsx**: Rastreamento de água com IA
- Cálculo automático de meta diária baseado em peso/atividade
- Configuração de lembretes personalizados (horário de acordar/dormir)
- **Web Push Notifications** para lembretes de hidratação
- Histórico de ingestões com gráficos e estatísticas
- Correção do contador de ingestões (bug fix recente)
- Tamanho de copo configurável (ml)
- Unidades: ml ou litros

### 3. Landing Page Completa
- **LandingPage.tsx**: Página institucional profissional
- Seções: Hero, Features, Pricing, FAQ, Testimonials
- Templates de email para onboarding e confirmação
- Design responsivo com gradientes modernos
- Call-to-actions estratégicos

### 4. Melhorias de UX/UI
- **Sidebar para desktop** com logotipo e navegação
- **Bottom navigation para mobile** (touch-friendly)
- Headers padronizados em todas as páginas
- Foto do perfil substituindo emoji na página inicial
- Contraste e sombreamento aumentados nos cards
- Remoção da seção "Assistente Nutricional" da página de perfil (agora apenas no chat dedicado)

### 5. Histórico Expandido
- **4 abas no HistoryPage**: Refeições, Peso, Atividades, **Hidratação** (novo)
- Filtros temporais aprimorados (hoje, semana, mês, tudo)
- Estatísticas detalhadas por categoria
- Gráficos de evolução para peso e hidratação

---

## Arquitetura do Projeto Atualizada

```
NutriMais/
├── index.html                  # Entry point HTML (Tailwind CDN + local)
├── index.tsx                   # Bootstrap do React
├── App.tsx                     # Router + PWAManager + Hydration Notifications
├── types.ts                    # Tipagens compartilhadas (expandido com hidratação)
├── vite.config.ts              # Vite + security headers plugin + PWA config
├── tsconfig.json               # Configuração TypeScript
├── package.json                # Dependências e scripts
├── config/
│   └── app.config.ts           # Metadados, URLs, feature flags e pricing
├── contexts/
│   └── AuthContext.tsx         # Provedor Supabase Auth com onboarding redirect
├── components/
│   ├── Auth/                   # Login, SignUp, ForgotPassword, AuthFlow
│   ├── Layout/                 # MainLayout, Sidebar, BottomNavigation, Icons (16+)
│   ├── UserPanel/              # Modais: Profile, Health, History, NutritionChat, CostAnalysis
│   ├── MealPlanner.tsx         # Planejamento com autocomplete de alimentos
│   ├── MealResult.tsx          # Exibição e edição de porções com recálculo dinâmico
│   ├── SaveMealModal.tsx       # Modal para salvar refeições
│   ├── AIAssistantFAB.tsx      # Floating action button para chat IA
│   ├── PWAComponents.tsx       # InstallPrompt, OfflineDetector, UpdateNotification
│   ├── HydrationHistory.tsx    # 🆕 Histórico de ingestões de água
│   └── Toast.tsx / ConfirmDeleteModal.tsx
├── pages/
│   ├── LandingPage.tsx         # 🆕 Landing institucional completa
│   ├── AuthPage.tsx            # Container de autenticação (login/cadastro)
│   ├── AuthCallbackPage.tsx    # 🆕 Callback para confirmação de email
│   ├── OnboardingPage.tsx      # 🆕 Wizard obrigatório de 5 passos
│   ├── HomePage.tsx            # Dashboard com resumo diário
│   ├── PlanMealPage.tsx        # Orquestra planner + resultados com IA
│   ├── HistoryPage.tsx         # 🆕 4 abas: refeições, peso, atividades, hidratação
│   ├── HealthPage.tsx          # Metas, IMC e registro de atividades
│   ├── ProfilePage.tsx         # Perfil, avatar e dados pessoais
│   ├── ChatPage.tsx            # Chat nutricional com IA (time-aware)
│   └── HydrationPage.tsx       # 🆕 Rastreamento completo de hidratação
├── services/
│   ├── geminiService.ts        # Chamada à Edge Function
│   ├── authService.ts          # Wrapper Supabase Auth
│   ├── profileService.ts       # Perfil com validação de onboarding
│   ├── mealHistoryService.ts   # Histórico de refeições
│   ├── weightHistoryService.ts # Histórico de peso com gráficos
│   ├── physicalActivityService.ts # Registro de atividades físicas
│   ├── hydrationService.ts     # 🆕 Gerenciamento de hidratação
│   ├── calorieGoalService.ts   # 🆕 Cálculo de metas calóricas com IA
│   ├── weightAnalysisService.ts # 🆕 Análise de tendências de peso
│   ├── avatarService.ts        # Upload/gerenciamento de avatar
│   ├── mealConsumptionService.ts # Consumo de refeições
│   ├── costAnalysisService.ts  # Painel administrativo
│   └── nutritionChatService.ts # Prompt engineering (time-aware)
├── data/
│   ├── activitiesDatabase.ts   # 116 atividades + MET values
│   ├── foodDatabase.ts         # 🆕 Banco de alimentos com autocomplete
│   └── dailyTips.ts            # 🆕 Dicas nutricionais diárias
├── utils/
│   ├── backgroundSync.tsx      # Fila offline + badge + sync queue
│   ├── bmiUtils.ts             # Cálculo de IMC com classificação colorida
│   ├── logger.ts               # Logger seguro (silenciado em produção)
│   ├── validation.ts           # Schemas Zod
│   └── hydrationNotifications.ts # 🆕 Push notifications para hidratação
├── email-templates/            # 🆕 Templates HTML de email
├── scripts/                    # Ferramentas PWA (validate, generate icons/splash)
├── migrations/                 # SQL manuais + apply-all-migrations.sql
└── supabase/
    ├── functions/gemini-proxy/ # Edge Function com rate limiting
    ├── functions/gemini-generic/ # Edge Function genérica
    ├── migrations/             # Migrações Supabase CLI
    └── functions/DEPLOY_INSTRUCTIONS.md
```

---

## Páginas da Aplicação (11 Páginas)

| Página | Rota | Status | Descrição |
|--------|------|--------|-----------|
| **LandingPage** | `/` | Público | Landing institucional com pricing e features |
| **AuthPage** | `/login`, `/register` | Público | Login e cadastro |
| **AuthCallbackPage** | `/auth/callback` | Público | Confirmação de email |
| **OnboardingPage** | `/onboarding` | Protegido | **🆕 Wizard obrigatório de 5 passos** |
| **HomePage** | `/home` | Protegido | Dashboard com resumo diário |
| **PlanMealPage** | `/plan` | Protegido | Planejamento de refeições com IA |
| **HistoryPage** | `/history` | Protegido | **🆕 4 abas** (refeições, peso, atividades, hidratação) |
| **HealthPage** | `/health` | Protegido | Metas, IMC e atividades |
| **ProfilePage** | `/profile` | Protegido | Perfil, avatar e senha |
| **ChatPage** | `/chat` | Protegido | Chat nutricional com IA |
| **HydrationPage** | `/hydration` | Protegido | **🆕 Rastreamento de água** |

---

## Novos Componentes e Features

### 🆕 OnboardingPage - Sistema de Configuração Inicial

**Localização**: [pages/OnboardingPage.tsx](pages/OnboardingPage.tsx)

**Passos do Wizard**:
1. **Bem-vindo**: Introdução ao sistema
2. **Dados Corporais**: Peso, altura com cálculo de IMC em tempo real
3. **Informações Pessoais**: Idade e sexo
4. **Nível de Atividade**: Sedentário até Extra Ativo
5. **Objetivos e Metas**: IA calcula calorias ideais por refeição

**Features**:
- Validação completa de inputs (peso 30-300kg, altura 100-250cm, idade 13-120)
- **Cálculo de IMC em tempo real** com código de cores
- **IA calcula metas calóricas** baseado em perfil completo
- Possibilidade de editar metas sugeridas
- Progresso visual com steps
- Redirecionamento forçado do AuthContext se dados incompletos
- Salvamento automático no Supabase (profile + weight_history)

**Integração**:
```typescript
// AuthContext redireciona para onboarding se dados incompletos
if (needsOnboarding(profile)) {
  navigate('/onboarding');
}
```

---

### 🆕 HydrationPage - Sistema de Hidratação

**Localização**: [pages/HydrationPage.tsx](pages/HydrationPage.tsx)

**Features Principais**:

#### 1. Cálculo Automático de Meta Diária
```typescript
// Fórmula baseada em peso e nível de atividade
baseWater = weight(kg) × 35ml
activityMultiplier = 1.0 (sedentário) até 1.5 (extra ativo)
dailyGoal = baseWater × activityMultiplier
```

#### 2. Configuração de Lembretes
- **Horário de acordar** (padrão: 07:00)
- **Horário de dormir** (padrão: 23:00)
- **Intervalo entre lembretes**: Calculado automaticamente
- **Notificações**: Som, vibração configuráveis
- **Web Push API** para lembretes nativos

#### 3. Registro de Ingestões
- **Tamanho do copo configurável** (padrão: 250ml)
- Botão rápido "Adicionar ingestão"
- Contador de ingestões diárias
- Percentual de progresso visual
- Unidades: ml ou litros

#### 4. Histórico e Estatísticas
- Total consumido hoje
- Número de ingestões
- Meta diária
- Percentual atingido
- Gráfico de evolução semanal

**Service**: [services/hydrationService.ts](services/hydrationService.ts)
```typescript
calculateDailyWaterGoal(weight, activityLevel)
generateReminders(wakeTime, sleepTime, dailyGoal, intakeSize)
logIntake(userId, amountMl, timestamp)
getProgress(userId, date)
```

**Notificações**: [utils/hydrationNotifications.ts](utils/hydrationNotifications.ts)
- Integração com Web Push API
- Agendamento de lembretes recorrentes
- Permission handling
- Fallback para browsers sem suporte

---

### 🆕 Sistema de Notificações Push

**Implementação**:
```typescript
// App.tsx
import('./utils/hydrationNotifications').then(module => {
  module.initializeHydrationNotifications();
});
```

**Features**:
- Solicita permissão do usuário
- Agenda notificações baseadas em configurações
- Respeita horário de acordar/dormir
- Som e vibração configuráveis
- Cancelamento automático ao desabilitar

---

## Services Atualizados

### 🆕 calorieGoalService.ts
**Responsabilidade**: Calcular metas calóricas usando IA

**Função Principal**:
```typescript
async calculateCalorieGoals(profile: UserProfile): Promise<CalorieGoals>
```

**Prompt para IA**:
```
Você é um nutricionista expert. Calcule as calorias ideais por refeição para:
- Peso: ${weight}kg
- Altura: ${height}cm
- Idade: ${age} anos
- Sexo: ${gender}
- Nível de atividade: ${activityLevel}
- Objetivo: ${goal}

Retorne JSON com:
{
  breakfast_calories: number,
  lunch_calories: number,
  dinner_calories: number,
  snack_calories: number,
  snack_quantity: number,
  total_daily_calories: number,
  explanation: string
}
```

---

### 🆕 hydrationService.ts
**Responsabilidade**: Gerenciar hidratação e lembretes

**Funções**:
- `getSettings(userId)` - Busca configurações
- `saveSettings(userId, settings)` - Salva configurações
- `logIntake(userId, amountMl)` - Registra ingestão
- `getProgress(userId, date)` - Progresso diário
- `getHistory(userId, days)` - Histórico de ingestões
- `calculateDailyWaterGoal(weight, activityLevel)` - Cálculo de meta
- `generateReminders(wakeTime, sleepTime, dailyGoal, intakeSize)` - Lembretes

---

### 🆕 weightAnalysisService.ts
**Responsabilidade**: Análise de tendências de peso

**Funções**:
- `analyzeTrend(weightHistory)` - Detecta tendência (ganho/perda/estável)
- `calculateAverageChange(weightHistory)` - Mudança média por semana
- `predictFutureWeight(weightHistory, weeks)` - Projeção futura
- `getWeeklySummary(weightHistory)` - Resumo semanal

---

## Tipos Atualizados (types.ts)

### 🆕 Tipos de Hidratação
```typescript
interface HydrationSettings {
  user_id: string;
  daily_goal_ml: number;
  wake_time: string;          // "07:00"
  sleep_time: string;         // "23:00"
  intake_size_ml: number;     // Tamanho do copo
  notifications_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  unit: 'ml' | 'liters';
  created_at: string;
  updated_at: string;
}

interface HydrationIntake {
  id: string;
  user_id: string;
  amount_ml: number;
  intake_time: string;
  created_at: string;
}

interface HydrationProgress {
  date: string;
  consumed_ml: number;
  goal_ml: number;
  intake_count: number;
  percentage: number;
}

interface HydrationReminder {
  time: string;
  amount_ml: number;
}
```

### 🆕 Tipos de Onboarding
```typescript
interface CalorieGoals {
  breakfast_calories: number;
  lunch_calories: number;
  dinner_calories: number;
  snack_calories: number;
  snack_quantity: number;
  total_daily_calories: number;
  explanation?: string;
}

type GoalType = 'lose' | 'maintain' | 'gain' | 'muscle_gain' | 'custom';
```

---

## Histórico de Mudanças Recentes

### Commit 6a06a32 (Mais Recente)
**feat: Sistema completo de hidratação com correção do contador de ingestões**
- HydrationPage completa
- hydrationService com todas as funções
- Web Push Notifications
- Correção de bug no contador de ingestões
- Histórico de hidratação no HistoryPage

### Commit 89c9deb
**feat: Sistema de onboarding obrigatório, encoding UTF-8 corrigido e melhorias UX**
- OnboardingPage com wizard de 5 passos
- calorieGoalService com IA
- Correção de encoding UTF-8 em todos os arquivos
- Redirecionamento forçado do AuthContext
- Validações completas de inputs

### Commit 6031e8e
**feat: Landing page completa, templates de email e correção do assistente nutricional**
- LandingPage profissional
- Templates de email HTML
- Correção do assistente nutricional (time-aware)
- AuthCallbackPage para confirmação

### Commit e661e3f
**style: Aumentar contraste e intensidade de sombreamentos dos cards**
- Melhor legibilidade
- Shadows mais pronunciados
- Cards com mais depth

### Commit 547f38a
**feat: Remover seção Assistente Nutricional da página de perfil**
- Chat IA exclusivo em /chat
- Perfil mais focado em dados pessoais

### Commit 4b4899d
**refactor: Padronizar headers em Início, Perfil e Planejar**
- Consistência visual
- Headers uniformes
- Melhor UX

### Commit 2787ed6
**feat: Adicionar sidebar com logotipo para desktop e manter bottom nav para mobile**
- Sidebar elegante para desktop
- Bottom navigation touch-friendly para mobile
- Responsive design

### Commit bde8548
**feat: Substituir emoji por foto do perfil na página inicial**
- Avatar do usuário em vez de emoji
- Experiência mais personalizada

---

## Features Implementadas ✅

- ✅ Sistema completo de autenticação (Supabase)
- ✅ **Onboarding obrigatório com IA** (cálculo de metas)
- ✅ Planejamento de refeições com IA (40/30/30)
- ✅ Edição de porções com recálculo dinâmico
- ✅ Cálculo de índice/carga glicêmica
- ✅ Registro de atividades físicas (116 atividades)
- ✅ **Sistema completo de hidratação com notificações**
- ✅ Histórico expandido (4 abas)
- ✅ Chat nutricional com IA (time-aware)
- ✅ Progressive Web App (PWA)
- ✅ Modo offline + Background Sync
- ✅ **Landing page profissional**
- ✅ **Templates de email**
- ✅ Sistema de favoritos
- ✅ Análise de tendências de peso
- ✅ **Sidebar desktop + Bottom nav mobile**
- ✅ **Avatar do usuário**
- ✅ Daily nutrition tips

---

## Próximos Passos Sugeridos

### Alta Prioridade
1. **Integrar validação Zod** nos formulários (AuthPage, ProfilePage, HealthPage)
2. **Migrar TailwindCSS para build local** (remover CDN)
3. **Implementar testes automatizados** (Vitest/Jest)
4. **Política de Privacidade e Termos** (conformidade LGPD)
5. **Rotacionar credenciais** expostas no .env.local

### Média Prioridade
6. **Exportar dados** (PDF/JSON para LGPD)
7. **Deletar conta** (funcionalidade obrigatória LGPD)
8. **Senha forte obrigatória** (≥12 caracteres)
9. **Confirmação de email obrigatória**
10. **Migrar tokens para cookies httpOnly**

### Baixa Prioridade (Features)
11. **Planejamento semanal** de refeições
12. **Receitas favoritas** (combinações salvas)
13. **Compartilhamento** via Web Share API
14. **Camera API** para fotos de alimentos
15. **Dark mode** toggle

---

## Métricas de Qualidade Atual

### Funcionalidades
- **11 páginas** completas
- **28+ componentes** modulares
- **14 services** integrados
- **3 databases locais** (alimentos, atividades, dicas)
- **Score de completude**: 90/100

### Segurança
- **Score de segurança**: 35/100 (🚨 crítico)
- **4 vulnerabilidades críticas**
- **5 vulnerabilidades altas**
- **Conformidade LGPD**: ❌ Não conforme

### Código
- **TypeScript**: 100% tipado
- **Cobertura de testes**: 0%
- **Vulnerabilidades npm**: 0
- **Build size**: ~50KB minificado

---

## Conclusão

O NutriMais AI está **funcionalmente completo** com todas as features principais implementadas, incluindo o novo **sistema de onboarding obrigatório** e o **sistema completo de hidratação com notificações**. A aplicação oferece uma experiência moderna e intuitiva com:

- 🤖 IA integrada em múltiplos pontos
- 📱 PWA instalável (Android/iOS/Desktop)
- 💧 Rastreamento de hidratação com lembretes
- 🏋️ 116 atividades físicas catalogadas
- 📊 Histórico completo com 4 categorias
- 🎨 UI moderna e responsiva
- 🔒 Autenticação segura com Supabase

**Prioridade atual**: Resolver **vulnerabilidades de segurança críticas** e garantir **conformidade com LGPD** antes de qualquer deploy em produção.

---

**Última atualização**: Janeiro 2025
**Versão**: 1.3.0 (Hydration + Onboarding)
**Status**: Funcionalmente completo, pendente melhorias de segurança
