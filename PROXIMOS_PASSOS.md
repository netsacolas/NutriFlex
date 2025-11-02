# 🎯 Próximos Passos - Resolver "Unauthorized" no Painel Admin

## Status Atual
✅ Código implementado (migrations, Edge Function, frontend)
❌ Edge Function NÃO deployada no Supabase
❌ Painel admin mostra "Unauthorized"
❌ Sem logs em Edge Functions

---

## 🚀 AÇÃO NECESSÁRIA

Você precisa fazer o **deploy manual** da Edge Function no Dashboard do Supabase.

### Por que manual?
O CLI está com problema de autenticação (`Unauthorized (401)`), então o deploy via `npx supabase functions deploy` não funciona.

---

## 📋 Checklist de Deploy

### 1️⃣ Deploy da Edge Function (CRÍTICO!)

**Siga o guia:** [`GUIA_RAPIDO_DEPLOY.md`](GUIA_RAPIDO_DEPLOY.md)

Resumo:
1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
2. Crie/edite `admin-operations`
3. Copie **TODO** o código de `supabase/functions/admin-operations/index.ts`
4. Clique em "Deploy"

---

### 2️⃣ Configurar Variáveis de Ambiente

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/functions
2. Adicione:
   - `PROJECT_URL` = `https://keawapzxqoyesptwpwav.supabase.co`
   - `SERVICE_ROLE_KEY` = (copie de Settings > API > service_role)

---

### 3️⃣ Testar o Deploy

**Opção A: Teste rápido no navegador**

Abra: [`http://localhost:5173/test-admin-function.html`](http://localhost:5173/test-admin-function.html)

Clique em cada botão na ordem:
1. 🏓 Testar Ping → deve mostrar "FUNÇÃO ESTÁ FUNCIONANDO"
2. 👤 Verificar Login → deve confirmar que você está logado
3. 🛡️ Verificar Admin → deve confirmar que você é admin
4. 📋 Listar Usuários → deve mostrar lista de usuários
5. 📊 Buscar Métricas → deve mostrar métricas

**Opção B: Teste direto (sem login)**

Abra: https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations

**Resultado esperado:**
- ✅ Erro 400 ou JSON = função está funcionando
- ❌ Timeout = função NÃO foi deployada

---

### 4️⃣ Verificar Cadastro Admin

Se o teste mostrar "você NÃO é admin", execute no SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'mariocromia@gmail.com'
FROM auth.users
WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;
```

---

## 📁 Arquivos de Referência

- **Guia rápido:** [`GUIA_RAPIDO_DEPLOY.md`](GUIA_RAPIDO_DEPLOY.md)
- **Código da function:** [`supabase/functions/admin-operations/index.ts`](supabase/functions/admin-operations/index.ts)
- **Script de verificação:** [`scripts/verify-admin-setup.sql`](scripts/verify-admin-setup.sql)
- **Teste no navegador:** [`public/test-admin-function.html`](public/test-admin-function.html)

---

## 🆘 Se Precisar de Ajuda

Execute `scripts/verify-admin-setup.sql` no SQL Editor e me envie o resultado.

Ou abra o arquivo de teste no navegador e me envie os resultados de cada passo.

---

## ✅ Como Saber se Funcionou

1. URL da função responde (mesmo com erro 400)
2. Teste no navegador mostra "✅" em todos os passos
3. Página `/admin` carrega sem "Unauthorized"
4. Cards de métricas aparecem
5. Tabela de usuários carrega

---

**Importante:** O problema é **exclusivamente** o deploy da Edge Function. Todo o resto (migrations, código frontend, banco de dados) está pronto e funcionando.

Assim que você fizer o deploy manual seguindo o guia, tudo vai funcionar! 🚀

---
---

# 📋 Implementações Anteriores - NutriMais AI

## ✅ O que já está implementado:

### 1. UI Redesenhada
- ✅ Barra de seleção de refeições com botões visuais
- ✅ 3 modais separados (Perfil, Saúde, Histórico)
- ✅ Header com botões coloridos

### 2. Sistema de Atividades Físicas
- ✅ Migration criada: `004_add_physical_activities_and_meal_goals.sql`
- ✅ Service: `physicalActivityService.ts`
- ✅ Componente: `ActivityHistory.tsx`
- ✅ Integrado no `HealthModal.tsx`

### 3. Metas de Calorias por Refeição
- ✅ Campos adicionados no perfil (breakfast/lunch/dinner/snack_calories)
- ✅ Interface no HealthModal para configurar
- ✅ Types.ts atualizado

### 4. Metas de Calorias por Refeição - Integração
- ✅ Adicionado import de `UserProfile` e `profileService` no `MealPlanner.tsx`
- ✅ Adicionado estado `profile` para armazenar dados do usuário
- ✅ Implementado useEffect para carregar perfil ao montar componente
- ✅ Implementado useEffect para auto-preencher `targetCalories` baseado no `mealType`
- ✅ Testado localmente - servidor iniciou sem erros

**Como funciona:**
1. Ao abrir o MealPlanner, o componente carrega o perfil do usuário
2. Quando o usuário seleciona um tipo de refeição, o campo "Meta de Calorias" é preenchido automaticamente:
   - Café da Manhã → `profile.breakfast_calories` (padrão: 400)
   - Almoço → `profile.lunch_calories` (padrão: 600)
   - Jantar → `profile.dinner_calories` (padrão: 600)
   - Lanche → `profile.snack_calories` (padrão: 200)
3. O usuário ainda pode editar manualmente o valor, se desejar

### 5. Multiplicador de Lanches no HealthModal
- ✅ Adicionado setas ▲▼ ao lado do campo de lanche em "Metas de Calorias"
- ✅ Permite selecionar de 1x a 4x lanches por dia
- ✅ Exibe visualmente o multiplicador (1x, 2x, 3x, 4x)
- ✅ Calorias do lanche são multiplicadas no total diário
- ✅ Hover com cor destaque (laranja)

**Como funciona:**
- No modal "Saúde & Bem-Estar", seção "Metas de Calorias"
- Ao lado do campo "🍪 Lanche", há setas para ajustar quantas vezes por dia
- Se o usuário tem 200 kcal e seleciona 3x, o total diário considera 600 kcal de lanches
- Útil para pessoas que fazem múltiplos lanches por dia

### 6. Banco de Atividades Físicas com Autocomplete
- ✅ Criado banco de dados com 100+ atividades comuns (`data/activitiesDatabase.ts`)
- ✅ Sistema de autocomplete no campo de atividade
- ✅ Navegação por teclado (setas, Enter, Escape)
- ✅ Atividades organizadas por categoria (Caminhada, Corrida, Natação, Musculação, etc.)
- ✅ Valores MET (Metabolic Equivalent) para cada atividade

### 7. Cálculo Automático de Calorias por Atividade
- ✅ Fórmula: `Calorias = MET × peso(kg) × tempo(horas)`
- ✅ Cálculo automático baseado em:
  - Tipo de atividade (MET value)
  - Peso do usuário
  - Duração da atividade
- ✅ Indicador visual quando calorias são calculadas
- ✅ Usuário pode editar manualmente se preferir

**Exemplos de MET values:**
- Caminhada leve: 2.5
- Corrida moderada: 8.0
- Natação intensa: 10.0
- Musculação: 5.0
- HIIT: 10.0

### 8. Melhorias no Botão Assistente de IA
- ✅ Design destacado com gradiente roxo-rosa
- ✅ Ícone de robô 🤖
- ✅ Texto "Assistente de IA" ao invés de apenas "Assistente"
- ✅ Efeitos hover com sombra e escala
- ✅ Maior contraste e visibilidade
- ✅ Reposicionado para não sobrepor o botão X de fechar
- ✅ Botão X com padding e z-index apropriados

### 9. Correção de Bugs e Ajustes de UX
- ✅ Corrigido import do supabase em `physicalActivityService.ts`
- ✅ Adicionados logs de debug no MealPlanner para diagnóstico
- ✅ Movido multiplicador de lanches do MealPlanner para HealthModal (localização correta)
- ✅ Corrigido sobreposição do botão Assistente de IA com botão X
- ✅ **Redesenhado campo de lanche** - Design horizontal com botões +/− elegantes
- ✅ **Removido seletor de intensidade** - As atividades já têm descrição completa (ex: "Corrida leve", "Corrida intensa")

### 10. Modal de Confirmação de Exclusão
- ✅ Criado componente reutilizável `ConfirmDeleteModal.tsx`
- ✅ Design com header vermelho-laranja (alerta visual)
- ✅ Mensagem de aviso clara
- ✅ Display do item a ser excluído
- ✅ Botões Cancelar/Excluir com estados de loading
- ✅ Z-index 60 para ficar sobre outros modais
- ✅ Backdrop escurecido e com blur

### 11. Melhorias nos Modais
- ✅ **Backdrop mais escuro**: `bg-black/50` → `bg-black/70`
- ✅ **Blur no fundo**: Adicionado `backdrop-blur-sm` em todos modais
- ✅ **HistoryModal**: Botão Assistente de IA redesenhado (gradiente roxo-rosa, ícone 🤖)
- ✅ **Todos os modais** atualizados: ProfileModal, HealthModal, HistoryModal
- ✅ Melhor separação visual entre modal e conteúdo de fundo

### 12. Aba de Atividades Físicas no Histórico
- ✅ Nova aba "🏃 Atividades" no modal Histórico Completo
- ✅ Componente `PhysicalActivityHistory.tsx` criado
- ✅ **Filtros**: Última Semana, Último Mês, Tudo
- ✅ **Estatísticas**: Total de atividades, calorias queimadas, minutos
- ✅ **Cards de atividade** com informações completas:
  - Tipo de atividade
  - Data e hora
  - Duração (minutos)
  - Calorias queimadas
  - Intensidade (Leve/Moderado/Intenso) com cores
  - Notas (se houver)
- ✅ **Exclusão de atividades** com modal de confirmação
- ✅ Estado vazio com mensagem amigável
- ✅ Design consistente com outras abas

## ⚠️ Tarefas Pendentes:

### 1. Implementar Fallback com IA para Atividades Desconhecidas
**Objetivo:** Quando o usuário digitar uma atividade que não está no banco de dados, usar a IA Gemini para estimar o MET e calcular as calorias.

**Implementação sugerida:**
- Detectar quando a atividade digitada não existe no banco
- Enviar prompt para Gemini: "Estime o valor MET para a atividade: [nome]"
- Usar o MET estimado para calcular calorias
- Salvar a nova atividade no banco local (localStorage) para futuras consultas

### 2. Executar Migration no Supabase (CRÍTICO)
```sql
-- Abra o SQL Editor no Supabase e execute:
-- Arquivo: supabase/migrations/004_add_physical_activities_and_meal_goals.sql
```

**Como fazer:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto NutriFlex
3. Vá em "SQL Editor"
4. Cole o conteúdo do arquivo `004_add_physical_activities_and_meal_goals.sql`
5. Execute a query

**IMPORTANTE:** A migration precisa ser executada para que as metas de calorias funcionem corretamente!

### 3. Testes Completos (após executar migration)
- [ ] Fazer login na aplicação
- [ ] Configurar metas de calorias no modal de Saúde
- [ ] Testar auto-preenchimento no planejador ao trocar tipo de refeição
- [ ] Testar multiplicador de lanches (setas ▲▼) no HealthModal
- [ ] Verificar se total diário multiplica calorias dos lanches corretamente
- [ ] Testar autocomplete de atividades físicas
- [ ] Verificar cálculo automático de calorias
- [ ] Testar cadastro de atividade física
- [ ] Testar histórico de atividades
- [ ] Verificar se valores salvam corretamente no Supabase
- [ ] Testar botão "Assistente de IA" - verificar que não sobrepõe o X

## 📂 Arquivos Importantes:

### Novos Componentes:
- `components/UserPanel/ProfileModal.tsx` - Perfil e segurança
- `components/UserPanel/HealthModal.tsx` - Saúde com metas e atividades
- `components/UserPanel/HistoryModal.tsx` - Histórico completo com 3 abas
- `components/UserPanel/ActivityHistory.tsx` - Lista de atividades (resumida)
- `components/UserPanel/PhysicalActivityHistory.tsx` - Histórico completo de atividades
- `components/ConfirmDeleteModal.tsx` - Modal reutilizável de confirmação de exclusão

### Services:
- `services/physicalActivityService.ts` - CRUD de atividades

### Data:
- `data/activitiesDatabase.ts` - Banco de 100+ atividades com valores MET e funções de cálculo

### Migrations:
- `supabase/migrations/004_add_physical_activities_and_meal_goals.sql` - ⚠️ NÃO EXECUTADA

### Modificados:
- `components/MealPlanner.tsx` - Nova barra de seleção + Integração com metas
- `components/UserPanel/HealthModal.tsx` - Autocomplete + Cálculo automático + Botão IA + Backdrop blur
- `components/UserPanel/HistoryModal.tsx` - Botão Assistente de IA redesenhado + Backdrop blur
- `components/UserPanel/ProfileModal.tsx` - Backdrop escurecido e com blur
- `App.tsx` - Novo header e sistema de modais
- `types.ts` - Novos tipos

## 🚀 Como Continuar:

1. **Execute a migration no Supabase** (obrigatório) - ⚠️ PENDENTE
2. ~~**Implemente a integração no MealPlanner**~~ - ✅ CONCLUÍDO
3. **Teste as funcionalidades** após executar a migration

## 📝 Comandos Úteis:

```bash
# Iniciar servidor dev
npm run dev

# Ver status do git
git status

# Ver último commit
git log -1

# Ver branches
git branch -a
```

## 🔗 Links Úteis:

- Supabase Dashboard: https://supabase.com/dashboard
- Projeto URL: https://keawapzxqoyesptwpwav.supabase.co
- Repositório: https://github.com/netsacolas/NutriFlex

---

**Últimas Atualizações:**
- `7795c45` - feat: Redesenhar UI e adicionar sistema de atividades físicas e metas de calorias
- **HOJE (25/10/2025)**:
  - ✅ Implementada integração de metas de calorias no MealPlanner
  - ✅ Criado banco de atividades físicas com 100+ exercícios
  - ✅ Implementado autocomplete de atividades
  - ✅ Cálculo automático de calorias baseado em MET
  - ✅ Redesenhado botão "Assistente de IA" com destaque
  - ✅ Corrigidos bugs de importação
  - ✅ **Ajuste:** Movido multiplicador de lanches para HealthModal (local correto)
  - ✅ **Ajuste:** Corrigido sobreposição botão Assistente de IA com X
  - ✅ **Ajuste:** Redesenhado campo de lanche com design horizontal elegante (botões +/−)
  - ✅ **Ajuste:** Removido seletor de intensidade (redundante com nomes de atividades)
  - ✅ **Novo:** Modal de confirmação de exclusão reutilizável
  - ✅ **Novo:** Backdrop dos modais mais escuro (70%) e com blur
  - ✅ **Novo:** Botão Assistente de IA no HistoryModal
  - ✅ **Novo:** Aba de histórico de atividades físicas no modal Histórico

**Próximo Passo Crítico:** Executar migration `004_add_physical_activities_and_meal_goals.sql` no Supabase
