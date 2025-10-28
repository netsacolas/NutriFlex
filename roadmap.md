# Roadmap NutriMais AI

Documento elaborado a partir das recomendações de segurança e compliance destacadas em `claude.md`. Todas as tarefas estão priorizadas para facilitar execução em ciclos curtos.

## 1. Prioridade Imediata (Semana 0-1)
- `Segurança` Revogar credenciais expostas (Gemini, Supabase) e garantir que `.env.local` esteja ignorado pelo Git.
- `Automação` Criar verificação automática nas pipelines/git hooks que bloqueie commits contendo arquivos `.env` ou chaves sensíveis.
- `Observabilidade` Remover ou isolar `console.log` sensíveis; adicionar utilitário de logging condicionado a `import.meta.env.DEV`.
- `Backend` Especificar e publicar proxy seguro (Supabase Edge Function ou backend dedicado) para encapsular chamadas ao Gemini.
- `Validação` Introduzir `zod` nos formulários críticos (`ProfileModal`, `HealthModal`, `MealPlanner`) para validar/sanitizar entradas.

## 2. Curto Prazo (Semanas 2-3)
- `Segurança` Aumentar política de senha para mínimo de 12 caracteres + complexidade e ajustar telas/validações.
- `Rate Limiting` Configurar limites de requisições (login, geração de planos) no Supabase/Cloudflare.
- `Autenticação` Ativar confirmação de e-mail e revisar fluxos existentes para refletir o estado “pendente”.
- `Storage` Substituir `localStorage` por cookies `httpOnly` (ou storage seguro equivalente) para tokens de sessão.
- `Headers` Adicionar middleware/configuração com CSP, X-Frame-Options, X-Content-Type-Options e HSTS no servidor/proxy.

## 3. Compliance LGPD (Semanas 4-5)
- `Políticas` Redigir e publicar Política de Privacidade e Termos de Uso alinhados ao tratamento de dados de saúde.
- `Consentimento` Incluir checkbox explícito no cadastro com link para termos + registro de auditoria.
- `Portabilidade` Implementar exportação de dados pessoais (JSON/CSV) acessível pelo usuário autenticado.
- `Eliminação` Implementar fluxo de deleção de conta que remova dados no Supabase e serviços integrados.
- `Transparência` Atualizar onboarding e telas para listar quais dados são coletados, finalidade e compartilhamento com terceiros.

## 4. Médio Prazo (Semanas 6-8)
- `Automação` Converter checklist de segurança em script de CI que valide itens críticos (ex.: presença de headers, dependências, lint).
- `Timeout/Resiliência` Adicionar timeouts e retry controlado nas chamadas ao Supabase/Gemini + fallback de UI.
- `CSRF` Incluir proteção explícita (tokens anti-CSRF ou SameSite=strict + double submit) no fluxo autenticado.
- `Favoritos` Migrar favoritos de `localStorage` para tabela no Supabase com RLS aplicada.

## 5. Qualidade e Testes Contínuos
- `Testes Unitários` Introduzir Vitest para validar regras de negócio (ex.: schemas Zod, cálculo de macros, MET).
- `Testes E2E` Selecionar ferramenta (Playwright/Cypress) e criar smoke tests para login, planejamento de refeição e histórico.
- `Segurança` Agendar execuções periódicas de `npm audit` + scanner SAST e revisão trimestral das políticas RLS.
- `Monitoramento` Avaliar integração com Sentry/LogRocket para rastrear erros e sessões suspeitas.

## 6. Gestão e Acompanhamento
- `Backlog` Registrar cada item no gerenciador de tarefas (Kanban/Sprint) com owner e estimativa.
- `Revisões` Rodar cerimônia quinzenal focada em segurança/compliance para acompanhar métricas (score alvo 95/100).
- `Comunicação` Atualizar documentação interna sempre que um controle for implementado ou alterado.

> Sugestão: acompanhar progresso em OKRs mensurando aumento do score de segurança (35 → 60 → 95) e conclusão dos requisitos legais.
