# NutriMais AI - Documenta��o T�cnica Atualizada

## Vis�o Geral
NutriMais AI � uma aplica��o web inteligente para di�rio alimentar que simplifica o planejamento nutricional. Os usu�rios definem metas cal�ricas por refei��o, escolhem alimentos e a IA calcula automaticamente por��es ideais seguindo a distribui��o 40% carboidratos, 30% prote�nas e 30% gorduras. A experi�ncia foi desenhada como uma PWA multiplataforma, com suporte offline, sincroniza��o em segundo plano e notifica��es push.

### Objetivos Principais
- Automatizar c�lculos nutricionais mantendo possibilidade de ajuste manual por refei��o.
- Conduzir onboarding guiado para capturar dados antropom�tricos, h�bitos e objetivos.
- Consolidar hist�rico de refei��es, hidrata��o, peso, atividades e insights gerados pela IA.
- Oferecer experi�ncia responsiva, acess�vel e segura em diferentes dispositivos.

### Links Importantes
- **AI Studio App**: https://ai.studio/apps/drive/1Dbi9jO-Jmlmz2eT3Ldk05Q6NHUO1xVD8
- **Repository**: https://github.com/netsacolas/NutriMais.git
- **Repository Banner**: ![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## Stack Tecnol�gica
### Frontend
- **React 19.2.0** � componentes funcionais com hooks e suspense.
- **React Router DOM 7.9.4** � roteamento com rotas p�blicas e protegidas.
- **TypeScript 5.8.2** � garantia de tipagem e DX elevada.
- **Vite 6.2.0** � dev server r�pido com suporte a HMR e build otimizado.
- **Tailwind CSS 4.1.16** � utilit�rio CSS com presets locais e fallback CDN.

### Bibliotecas de apoio
- **Recharts 3.3.0** � gr�ficos de pizza e evolu��o temporal.
- **@google/genai 1.27.0** � SDK oficial do Gemini para consumo nas Edge Functions.
- **@supabase/supabase-js 2.76.1** � autentica��o, storage e banco de dados.
- **Zod 4.1.12** � schemas de valida��o centralizados em `utils/validation.ts`.

### Backend e Infraestrutura
- **Supabase** � autentica��o, PostgreSQL gerenciado, Edge Functions e storage.
- **Gemini 2.0 Flash Experimental** � modelo de IA respons�vel pelos c�lculos nutricionais e gera��o de insights.
- **PostgreSQL** � banco relacional com Row Level Security ativada.
- **Edge Functions (TypeScript)** � camada serverless para encapsular chamadas ao Gemini e regras de neg�cio sens�veis.

---

## Setup e Execu��o

### Pr�-requisitos
- Node.js 20.x ou superior.
- npm 10+ ou pnpm 9+ (scripts oficiais utilizam npm).
- Supabase CLI 1.181.0 ou superior para gerenciar migra��es.
- Acesso �s chaves do Gemini e do Supabase (ambiente de testes e produ��o).

### Configura��o inicial
1. Duplique `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, URLs de checkout Kiwify (`VITE_KIWIFY_CHECKOUT_*`) e os segredos `KIWIFY_PLAN_*`/`KIWIFY_WEBHOOK_SECRET` conforme ambiente.
3. Instale depend�ncias com `npm install`.
4. Inicie o ambiente local com `npm run dev` (porta padr�o 5173).

### Scripts �teis
- `npm run dev`: servidor de desenvolvimento com HMR.
- `npm run build`: build de produ��o com tree-shaking e minifica��o.
- `npm run preview`: serve est�tico do build para testes de QA.
- `npm run test:e2e`: executa a su�te Playwright; rodar `npx playwright install` na primeira vez para baixar os navegadores.
- `npm run validate:pwa`: valida manifest, service worker e pol�ticas PWA (scripts/validate-pwa.js).

### Provisionamento do Supabase
- Fa�a login com `supabase login` e vincule o projeto usando `supabase link --project-ref <ref>`.
- Execute `supabase migration up` (ou `supabase db push`) para aplicar as migra��es em `supabase/migrations`.
- Se preferir SQL puro, utilize `apply-all-migrations.sql` diretamente no editor SQL do Supabase.
- Certifique-se de aplicar a migracao `009_add_subscriptions.sql` (tabela `user_subscriptions` + trigger em `auth.users`) antes de habilitar a cobranca.
- Garanta que as pol�ticas RLS estejam publicadas e que os buckets de storage de avatares estejam com permiss�es corretas.

### Dados locais e seeds
- O diret�rio `data/` cont�m `foodDatabase.ts`, `activitiesDatabase.ts` e `dailyTips.ts`, usados como fonte de dados est�ticos.
- Scripts em `scripts/` podem auxiliar no carregamento de dados adicionais ou valida��es automatizadas.
- Para testar notifica��es PWA, utilize os exemplos em `public/` e os arquivos `test-edge-function.html` e `test-database-connection.html`.

---

## Plano de Testes

### Metas
- Elevar cobertura de componentes cr�ticos (onboarding, planner, hidrata��o) para acima de 70%.
- Validar fluxos de autentica��o, onboarding obrigat�rio e c�lculos da IA.
- Monitorar regress�es em integra��es com Supabase, Edge Functions e funcionalidades PWA.

### Ferramentas recomendadas
- **Vitest** + **React Testing Library** para testes de unidade e componentes.
- **MSW (Mock Service Worker)** para simular respostas do Supabase e do Gemini.
- **Playwright** para fluxos end-to-end (onboarding, planejamento, hidrata��o).

### Roadmap incremental
1. Configurar Vitest no projeto (`vitest.config.ts`) e criar su�te smoke para p�ginas cr�ticas.
2. Testar hooks e servi�os (`hooks/`, `services/`) com mocks do Supabase.
3. Cobrir fluxos de UI (onboarding e planner) com testes de intera��o (RTL).
4. Adicionar smoke tests E2E com Playwright usando banco Supabase de staging.
5. Integrar execu��o de testes em CI (GitHub Actions) com badges no README.

### Progresso atual (Outubro 2025)
- Vitest configurado com `vitest.setup.ts`, `vitest.config.ts` e reporter de cobertura (`@vitest/coverage-v8`).
- Testes unit�rios cobrindo `calorieGoalService`, `hydrationService`, `AuthContext` e o hook `useRequiredProfile`.
- Testes de interface para `LandingPage`, `PlanMealPage` e `HydrationPage`, validando redirecionamentos protegidos e preenchimento autom�tico.
- Pipeline GitHub Actions (`.github/workflows/tests.yml`) executa `npm run test -- --coverage` em push/PR.
- Navegadores Playwright instalados (`npx playwright install`) e su�te smoke (`npm run test:e2e`) garantindo visibilidade do hero e bot�es de convers�o da landing.

---

## Mitiga��es de Seguran�a Priorit�rias
- Concluir rota��o de credenciais expostas em `.env.local` e atualizar secrets em pipelines.
- Migrar Tailwind para build local removendo depend�ncia do CDN e habilitando CSP estrita.
- Implementar pol�tica de senhas fortes (m�nimo 12 caracteres, verifica��o em tempo real) no fluxo de cadastro.
- Ativar confirma��o de e-mail obrigat�ria e expira��o de magic links.
- Migrar tokens sens�veis para cookies `httpOnly` e refor�ar regras RLS no Supabase.
- Publicar pol�tica de privacidade e termos de uso alinhados � LGPD, com op��o de exclus�o de conta.
- Executar varredura peri�dica com `npx supabase secrets list` + dependabot e registrar findings em `SECURITY.md`.

---

## Atualiza��es Recentes (Janeiro 2025)
1. **Sistema de Onboarding Obrigat�rio** � wizard em cinco passos (`pages/OnboardingPage.tsx`) com c�lculo autom�tico de IMC e metas cal�ricas via `services/calorieGoalService.ts`.
2. **Sistema Completo de Hidrata��o** � p�gina dedicada (`pages/HydrationPage.tsx`) com metas personalizadas, hist�rico visual e notifica��es push configur�veis.
3. **Landing Page Institucional** � `pages/LandingPage.tsx` com se��es Hero, Features, Pricing, FAQ e depoimentos, al�m de templates de e-mail para onboarding.
4. **Melhorias de UX/UI** � sidebar para desktop, bottom navigation mobile, headers padronizados e avatar do usu�rio aplicado ao dashboard.
5. **Hist�rico Expandido** � `pages/HistoryPage.tsx` com quatro abas (refei��es, peso, atividades, hidrata��o), filtros temporais e gr�ficos de evolu��o.

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

## Paginas e Rotas-chave
- `/` -> `LandingPage.tsx`: apresentacao institucional e call-to-actions.
- `/auth` -> `AuthPage.tsx`: login, cadastro e recuperacao de senha (Supabase Auth).
- `/onboarding` -> `OnboardingPage.tsx`: fluxo obrigatorio de configuracao inicial.
- `/app` -> `HomePage.tsx`: dashboard com resumo diario.
- `/plan` -> `PlanMealPage.tsx`: planejamento de refeicoes assistido por IA.
- `/history` -> `HistoryPage.tsx`: historico com filtros e graficos.
- `/hydration` -> `HydrationPage.tsx`: acompanhe ingestao de agua e lembretes.
- `/chat` -> `ChatPage.tsx`: assistente nutricional assincrono (Gemini).
- `/assinatura` -> `SubscriptionPage.tsx`: gerenciamento dos planos Kiwify, checkout e status do usuario.
- `/profile` -> `ProfilePage.tsx`: dados pessoais, metas e preferencias.
- `/health` -> `HealthPage.tsx`: registro de peso, metas e atividades fisicas.
---

## Servicos e Integracoes
- `services/geminiService.ts`: encapsula chamadas as Edge Functions que conversam com o Gemini (prompt engineering e limites de taxa).
- `services/authService.ts`: wrapper de autenticacao e recuperacao de sessao do Supabase.
- `services/profileService.ts`: sincroniza dados de perfil, garantindo que o onboarding permanece obrigatorio.
- `services/subscriptionService.ts`: centraliza limites do plano (refeicoes, historico, chat) e gera links de checkout Kiwify.
- `services/calorieGoalService.ts`: calcula metas caloricas personalizadas (TMB, fator de atividade e objetivo).
- `contexts/SubscriptionContext.tsx`: provider global que expoe `plan`, `limits`, `openCheckout` e escuta mudancas via realtime.
- Edge Functions Supabase: validam ingestao nutricional/hidratacao, processam webhooks da Kiwify (`kiwify-webhook`) e retornam planos ajustados pelo Gemini.

## Fluxo do Usuario
1. Usuario cria conta ou autentica-se via Supabase Auth.
2. E redirecionado ao onboarding obrigatorio para preencher dados basicos, objetivos e preferencias alimentares.
3. Apos conclusao, acessa o dashboard (`HomePage`) com resumo diario.
4. Planeja refeicoes em `/plan`, recebendo sugestoes e ajustes da IA em tempo real.
5. No plano gratis, encontra avisos de limite (2 refeicoes/dia, historico reduzido, chat bloqueado) com call-to-action para `/assinatura`.
6. Caso seja Premium, utiliza o chat completo, registra refeicoes ilimitadas e visualiza historico integral.
7. Registra ingestoes de agua, atividades fisicas e atualiza peso atraves das paginas dedicadas.
8. Recebe notificacoes push configuradas (hidratacao, lembretes de refeicoes) e acompanha relat�rios.
---

## Metricas e Indicadores
- **Funcionalidades**: 12 paginas principais, 30+ componentes reutilizaveis, 16 servicos integrados (inclui modulo de assinatura).
- **Cobertura de codigo**: 51% linhas / 59% branches / 22% funcoes (Vitest v8, foco nos modulos criticos monitorados). Meta permanece >=70% apos ampliacao da suite.
- **Seguranca**: score atual estimado em 35/100 com quatro vulnerabilidades criticas e cinco altas identificadas (ver `SECURITY.md`).
- **Performance**: bundle ~50 KB minificado; continuar monitorando lighthouse no build de producao.
- **Monetizacao**: estado de assinatura sincronizado via Supabase (tabela `user_subscriptions`) e webhooks Kiwify em producao, limites aplicados no frontend.
- **Conformidade LGPD**: pendente. Priorizar politica de privacidade, exportacao de dados e exclusao de conta.
---

- 2025-10-29 - modulo de assinatura integrado a Kiwify (checkout, webhooks), provider de limites e telas de upgrade.
## Hist�rico de Mudan�as Recentes
- `6031e8e` � landing page completa, templates de e-mail e corre��es no assistente nutricional.
- `e661e3f` � contraste e sombras aprimorados para melhor legibilidade.
- `547f38a` � remo��o da se��o "Assistente Nutricional" do perfil; chat dedicado em `/chat`.
- `4b4899d` � padroniza��o de headers no dashboard e p�ginas principais.
- `2787ed6` � sidebar desktop e bottom navigation mobile.
- `bde8548` � avatar do usu�rio substitui emoji no dashboard.

---
## Proximos Passos Prioritarios
1. Implementar suite de testes com Vitest + RTL e automatizar execucao em CI (incluindo cenarios Free/Premium).
2. Migrar Tailwind para build local, reforcar CSP e revisar politicas de seguranca (LGPD + tokens httpOnly).
3. Entregar politica de privacidade, termos de uso e funcionalidade de exclusao de conta.
4. Adicionar exportacao de dados (PDF/JSON) e reforcar fluxo de confirmacao de e-mail.
5. Monitorar consumo da API/checkout Kiwify (logs da Edge Function) e documentar playbook de cancelamento/reembolso.
6. Criar modo escuro opcional apos estabilizacao das melhorias de seguranca.

---

## Diretrizes para Agentes
- Sempre responda em portugu�s do Brasil, com acentua��o correta e vocabul�rio local sempre que o ambiente suportar UTF-8.
- Utilize tom colaborativo, objetivo e respeitoso.
- Prefira terminologia t�cnica em portugu�s; mantenha nomes pr�prios e identificadores em ingl�s quando necess�rio.
- Explique racioc�nios e decis�es de forma clara e estruturada para facilitar revis�es.
- Esta secao e a fonte de verdade; mantenha qualquer resumo em `agents.md` sincronizado com este documento.

---

## Conclus�o
O NutriMais AI encontra-se funcionalmente completo, com onboarding obrigat�rio, planejamento assistido por IA, hist�rico ampliado e monitoramento de hidrata��o. Os pr�ximos ciclos devem focar em endurecer seguran�a (LGPD, rota��o de credenciais) e estabelecer uma base s�lida de testes automatizados para suportar evolu��o cont�nua do produto.

---
**�ltima atualiza��o**: Outubro 2025  
**Vers�o**: 1.3.1 (Documenta��o revisada e sincronizada)  
**Status**: Pronto para testes extensivos e hardening de seguran�a
