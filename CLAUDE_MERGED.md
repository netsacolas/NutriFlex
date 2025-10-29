# NutriMais AI - Documentação Técnica Atualizada

## Visão Geral
NutriMais AI é uma aplicação web inteligente para diário alimentar que simplifica o planejamento nutricional. Os usuários definem metas calóricas por refeição, escolhem alimentos e a IA calcula automaticamente porções ideais seguindo a distribuição 40% carboidratos, 30% proteínas e 30% gorduras. A experiência foi desenhada como uma PWA multiplataforma, com suporte offline, sincronização em segundo plano e notificações push.

### Objetivos Principais
- Automatizar cálculos nutricionais mantendo possibilidade de ajuste manual por refeição.
- Conduzir onboarding guiado para capturar dados antropométricos, hábitos e objetivos.
- Consolidar histórico de refeições, hidratação, peso, atividades e insights gerados pela IA.
- Oferecer experiência responsiva, acessível e segura em diferentes dispositivos.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
- **Repository**: https://github.com/netsacolas/NutriMais.git
- **Repository Banner**: ![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## Stack Tecnológica
### Frontend
- **React 19.2.0** — componentes funcionais com hooks e suspense.
- **React Router DOM 7.9.4** — roteamento com rotas públicas e protegidas.
- **TypeScript 5.8.2** — garantia de tipagem e DX elevada.
- **Vite 6.2.0** — dev server rápido com suporte a HMR e build otimizado.
- **Tailwind CSS 4.1.16** — utilitário CSS com presets locais e fallback CDN.

### Bibliotecas de apoio
- **Recharts 3.3.0** — gráficos de pizza e evolução temporal.
- **@google/genai 1.27.0** — SDK oficial do Gemini para consumo nas Edge Functions.
- **@supabase/supabase-js 2.76.1** — autenticação, storage e banco de dados.
- **Zod 4.1.12** — schemas de validação centralizados em `utils/validation.ts`.

### Backend e Infraestrutura
- **Supabase** — autenticação, PostgreSQL gerenciado, Edge Functions e storage.
- **Gemini 2.0 Flash Experimental** — modelo de IA responsável pelos cálculos nutricionais e geração de insights.
- **PostgreSQL** — banco relacional com Row Level Security ativada.
- **Edge Functions (TypeScript)** — camada serverless para encapsular chamadas ao Gemini e regras de negócio sensíveis.

---

## Setup e Execução

### Pré-requisitos
- Node.js 20.x ou superior.
- npm 10+ ou pnpm 9+ (scripts oficiais utilizam npm).
- Supabase CLI 1.181.0 ou superior para gerenciar migrações.
- Acesso às chaves do Gemini e do Supabase (ambiente de testes e produção).

### Configuração inicial
1. Duplique `.env.example` para `.env.local`.
2. Preencha as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY` e demais segredos necessários.
3. Instale dependências com `npm install`.
4. Inicie o ambiente local com `npm run dev` (porta padrão 5173).

### Scripts úteis
- `npm run dev`: servidor de desenvolvimento com HMR.
- `npm run build`: build de produção com tree-shaking e minificação.
- `npm run preview`: serve estático do build para testes de QA.
- `npm run test:e2e`: executa a suíte Playwright; rodar `npx playwright install` na primeira vez para baixar os navegadores.
- `npm run validate:pwa`: valida manifest, service worker e políticas PWA (scripts/validate-pwa.js).

### Provisionamento do Supabase
- Faça login com `supabase login` e vincule o projeto usando `supabase link --project-ref <ref>`.
- Execute `supabase migration up` (ou `supabase db push`) para aplicar as migrações em `supabase/migrations`.
- Se preferir SQL puro, utilize `apply-all-migrations.sql` diretamente no editor SQL do Supabase.
- Garanta que as políticas RLS estejam publicadas e que os buckets de storage de avatares estejam com permissões corretas.

### Dados locais e seeds
- O diretório `data/` contém `foodDatabase.ts`, `activitiesDatabase.ts` e `dailyTips.ts`, usados como fonte de dados estáticos.
- Scripts em `scripts/` podem auxiliar no carregamento de dados adicionais ou validações automatizadas.
- Para testar notificações PWA, utilize os exemplos em `public/` e os arquivos `test-edge-function.html` e `test-database-connection.html`.

---

## Plano de Testes

### Metas
- Elevar cobertura de componentes críticos (onboarding, planner, hidratação) para acima de 70%.
- Validar fluxos de autenticação, onboarding obrigatório e cálculos da IA.
- Monitorar regressões em integrações com Supabase, Edge Functions e funcionalidades PWA.

### Ferramentas recomendadas
- **Vitest** + **React Testing Library** para testes de unidade e componentes.
- **MSW (Mock Service Worker)** para simular respostas do Supabase e do Gemini.
- **Playwright** para fluxos end-to-end (onboarding, planejamento, hidratação).

### Roadmap incremental
1. Configurar Vitest no projeto (`vitest.config.ts`) e criar suíte smoke para páginas críticas.
2. Testar hooks e serviços (`hooks/`, `services/`) com mocks do Supabase.
3. Cobrir fluxos de UI (onboarding e planner) com testes de interação (RTL).
4. Adicionar smoke tests E2E com Playwright usando banco Supabase de staging.
5. Integrar execução de testes em CI (GitHub Actions) com badges no README.

### Progresso atual (Outubro 2025)
- Vitest configurado com `vitest.setup.ts`, `vitest.config.ts` e reporter de cobertura (`@vitest/coverage-v8`).
- Testes unitários cobrindo `calorieGoalService`, `hydrationService`, `AuthContext` e o hook `useRequiredProfile`.
- Testes de interface para `LandingPage`, `PlanMealPage` e `HydrationPage`, validando redirecionamentos protegidos e preenchimento automático.
- Pipeline GitHub Actions (`.github/workflows/tests.yml`) executa `npm run test -- --coverage` em push/PR.
- Navegadores Playwright instalados (`npx playwright install`) e suíte smoke (`npm run test:e2e`) garantindo visibilidade do hero e botões de conversão da landing.

---

## Mitigações de Segurança Prioritárias
- Concluir rotação de credenciais expostas em `.env.local` e atualizar secrets em pipelines.
- Migrar Tailwind para build local removendo dependência do CDN e habilitando CSP estrita.
- Implementar política de senhas fortes (mínimo 12 caracteres, verificação em tempo real) no fluxo de cadastro.
- Ativar confirmação de e-mail obrigatória e expiração de magic links.
- Migrar tokens sensíveis para cookies `httpOnly` e reforçar regras RLS no Supabase.
- Publicar política de privacidade e termos de uso alinhados à LGPD, com opção de exclusão de conta.
- Executar varredura periódica com `npx supabase secrets list` + dependabot e registrar findings em `SECURITY.md`.

---

## Atualizações Recentes (Janeiro 2025)
1. **Sistema de Onboarding Obrigatório** — wizard em cinco passos (`pages/OnboardingPage.tsx`) com cálculo automático de IMC e metas calóricas via `services/calorieGoalService.ts`.
2. **Sistema Completo de Hidratação** — página dedicada (`pages/HydrationPage.tsx`) com metas personalizadas, histórico visual e notificações push configuráveis.
3. **Landing Page Institucional** — `pages/LandingPage.tsx` com seções Hero, Features, Pricing, FAQ e depoimentos, além de templates de e-mail para onboarding.
4. **Melhorias de UX/UI** — sidebar para desktop, bottom navigation mobile, headers padronizados e avatar do usuário aplicado ao dashboard.
5. **Histórico Expandido** — `pages/HistoryPage.tsx` com quatro abas (refeições, peso, atividades, hidratação), filtros temporais e gráficos de evolução.

---

## Arquitetura do Projeto

```
NutriMais/
|-- index.html
|-- index.tsx
|-- App.tsx
|-- types.ts
|-- vite.config.ts
|-- tsconfig.json
|-- package.json
|-- public/
|   |-- manifest.webmanifest
|   |-- service-worker.js
|-- components/
|   |-- Auth/
|   |-- Layout/
|   |-- UserPanel/
|   |-- HydrationHistory.tsx
|   |-- AIAssistantFAB.tsx
|-- pages/
|   |-- LandingPage.tsx
|   |-- AuthPage.tsx
|   |-- AuthCallbackPage.tsx
|   |-- OnboardingPage.tsx
|   |-- HomePage.tsx
|   |-- PlanMealPage.tsx
|   |-- HistoryPage.tsx
|   |-- HealthPage.tsx
|   |-- ProfilePage.tsx
|   |-- ChatPage.tsx
|   |-- HydrationPage.tsx
|-- services/
|   |-- geminiService.ts
|   |-- authService.ts
|   |-- profileService.ts
|   |-- calorieGoalService.ts
|-- contexts/
|   |-- AuthContext.tsx
|-- hooks/
|   |-- useAuth.ts
|   |-- useHydration.ts
|-- data/
|   |-- foodDatabase.ts
|   |-- activitiesDatabase.ts
|   |-- dailyTips.ts
|-- email-templates/
|-- scripts/
|   |-- validate-pwa.js
|-- supabase/
|   |-- migrations/
|-- utils/
|   |-- validation.ts
|-- migrations/
|-- dist/ (build)
```

---

## Páginas e Rotas-chave
- `/` → `LandingPage.tsx`: apresentação institucional e call-to-actions.
- `/auth` → `AuthPage.tsx`: login, cadastro e recuperação de senha (Supabase Auth).
- `/onboarding` → `OnboardingPage.tsx`: fluxo obrigatório de configuração inicial.
- `/app` → `HomePage.tsx`: dashboard com resumo diário.
- `/plan` → `PlanMealPage.tsx`: planejamento de refeições assistido por IA.
- `/history` → `HistoryPage.tsx`: histórico com filtros e gráficos.
- `/hydration` → `HydrationPage.tsx`: acompanhe ingestão de água e lembretes.
- `/chat` → `ChatPage.tsx`: assistente nutricional assíncrono (Gemini).
- `/profile` → `ProfilePage.tsx`: dados pessoais, metas e preferências.
- `/health` → `HealthPage.tsx`: registro de peso, metas e atividades físicas.

---

## Serviços e Integrações
- `services/geminiService.ts`: encapsula chamadas às Edge Functions que conversam com o Gemini (prompt engineering e limites de taxa).
- `services/authService.ts`: wrapper de autenticação e recuperação de sessão do Supabase.
- `services/profileService.ts`: sincroniza dados de perfil, garantindo que o onboarding permaneça obrigatório.
- `services/calorieGoalService.ts`: calcula metas calóricas personalizadas (TMB, fator de atividade e objetivo).
- Edge Functions Supabase: validam ingestão nutricional/hidratação e retornam planos ajustados pelo Gemini.

---

## Fluxo do Usuário
1. Usuário cria conta ou autentica-se via Supabase Auth.
2. É redirecionado ao onboarding obrigatório para preencher dados básicos, objetivos e preferências alimentares.
3. Após conclusão, acessa o dashboard (`HomePage`) com resumo diário.
4. Planeja refeições em `/plan`, recebendo sugestões e ajustes da IA em tempo real.
5. Registra ingestões de água, atividades físicas e atualiza peso através das páginas dedicadas.
6. Interage com o chat nutricional para recomendações adicionais.
7. Recebe notificações push configuradas (hidratação, lembretes de refeições) e acompanha histórico completo.

---

## Métricas e Indicadores
- **Funcionalidades**: 11 páginas principais, 28+ componentes reutilizáveis, 14 serviços integrados.
- **Cobertura de código**: 51% linhas / 59% branches / 22% funções (Vitest v8, foco nos módulos críticos monitorados). Meta permanece >=70% após ampliação da suíte.
- **Segurança**: score atual estimado em 35/100 com quatro vulnerabilidades críticas e cinco altas identificadas (ver `SECURITY.md`).
- **Performance**: bundle ~50 KB minificado; continuar monitorando lighthouse no build de produção.
- **Conformidade LGPD**: pendente. Priorizar política de privacidade, exportação de dados e exclusão de conta.

---

## Histórico de Mudanças Recentes
- `6031e8e` — landing page completa, templates de e-mail e correções no assistente nutricional.
- `e661e3f` — contraste e sombras aprimorados para melhor legibilidade.
- `547f38a` — remoção da seção "Assistente Nutricional" do perfil; chat dedicado em `/chat`.
- `4b4899d` — padronização de headers no dashboard e páginas principais.
- `2787ed6` — sidebar desktop e bottom navigation mobile.
- `bde8548` — avatar do usuário substitui emoji no dashboard.

---

## Próximos Passos Prioritários
1. Implementar suite de testes com Vitest + RTL e automatizar execução em CI.
2. Migrar Tailwind para build local, reforçar CSP e revisar políticas de segurança (LGPD + tokens httpOnly).
3. Entregar política de privacidade, termos de uso e funcionalidade de exclusão de conta.
4. Adicionar exportação de dados (PDF/JSON) e reforçar fluxo de confirmação de e-mail.
5. Criar modo escuro opcional após estabilização das melhorias de segurança.

---

## Diretrizes para Agentes
- Sempre responda em português do Brasil, com acentuação correta e vocabulário local sempre que o ambiente suportar UTF-8.
- Utilize tom colaborativo, objetivo e respeitoso.
- Prefira terminologia técnica em português; mantenha nomes próprios e identificadores em inglês quando necessário.
- Explique raciocínios e decisões de forma clara e estruturada para facilitar revisões.
- Esta seção permanece em sincronia com `agents.md`, que é a fonte de verdade para orientações de interação.

---

## Conclusão
O NutriMais AI encontra-se funcionalmente completo, com onboarding obrigatório, planejamento assistido por IA, histórico ampliado e monitoramento de hidratação. Os próximos ciclos devem focar em endurecer segurança (LGPD, rotação de credenciais) e estabelecer uma base sólida de testes automatizados para suportar evolução contínua do produto.

---
**Última atualização**: Outubro 2025  
**Versão**: 1.3.1 (Documentação revisada e sincronizada)  
**Status**: Pronto para testes extensivos e hardening de segurança

