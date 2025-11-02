# Deploy do Painel Administrativo Avançado

## Problema Identificado

A página de administração mostra "Unauthorized" porque a Edge Function `admin-operations` precisa ser atualizada com os novos endpoints.

## Solução

### 1. Fazer deploy da Edge Function atualizada

A Edge Function em `supabase/functions/admin-operations/index.ts` já está atualizada com todos os endpoints necessários:

✅ **Endpoints implementados:**
- `list_users` - Listagem avançada com filtros
- `get_metrics` - Métricas de planos e riscos
- `list_segments` - Listar segmentos salvos
- `save_segment` - Salvar/atualizar segmento
- `delete_segment` - Deletar segmento
- `get_user_history` - Histórico de auditoria
- `get_users_by_ids` - Buscar múltiplos usuários
- `update_subscription` - Atualizar assinatura individual
- `bulk_update` - Atualização em massa
- `export_users` - Exportar para CSV
- `search_users` - Busca simples (backward compatibility)
- `get_user_details` - Detalhes de usuário (backward compatibility)

### 2. Deploy via Dashboard do Supabase

Como o CLI está com problema de autenticação, faça o deploy manualmente:

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Clique em "admin-operations" (se já existir) ou "New Function"

3. Cole o conteúdo do arquivo `supabase/functions/admin-operations/index.ts`

4. Clique em "Deploy"

### 3. Verificar as migrations foram aplicadas

Certifique-se de que as migrations foram executadas no banco:

```sql
-- Verificar se a migration 015 foi aplicada
SELECT * FROM public.admin_user_snapshot LIMIT 1;
SELECT * FROM public.admin_subscription_audit LIMIT 1;
SELECT * FROM public.admin_saved_segments LIMIT 1;
```

Se as tabelas não existirem, execute:

**Opção A: Via SQL Editor**
Execute o arquivo `supabase/migrations/015_admin_panel_enhancements.sql`

**Opção B: Via script consolidado**
Execute o arquivo `scripts/apply-admin-system.sql` (inclui tudo)

### 4. Verificar secrets da Edge Function

A function precisa das seguintes variáveis de ambiente:

- `PROJECT_URL` ou `SUPABASE_URL`
- `SERVICE_ROLE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

Verifique em: Settings > Edge Functions > Environment Variables

### 5. Testar a Edge Function

Após o deploy, teste chamando a function:

```bash
curl -X POST \
  https://keawapzxqoyesptwpwav.supabase.co/functions/v1/admin-operations \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"action": "get_metrics", "type": "plan"}'
```

### 6. Testar no frontend

1. Faça login com `mariocromia@gmail.com`
2. Acesse `/admin`
3. A página deve carregar com:
   - Cards de métricas no topo
   - Filtros avançados
   - Tabela de usuários
   - Paginação

## Checklist de Deploy

- [ ] Migration 014 aplicada (tabela `admin_users` + funções básicas)
- [ ] Migration 015 aplicada (view `admin_user_snapshot` + funções avançadas)
- [ ] Edge Function `admin-operations` atualizada com todos os endpoints
- [ ] Usuário `mariocromia@gmail.com` cadastrado em `admin_users`
- [ ] Secrets configurados na Edge Function
- [ ] Teste de listagem funcionando
- [ ] Teste de métricas funcionando

## Troubleshooting

### Erro: "Unauthorized"

**Causa:** Edge Function não está deployada ou não tem acesso ao banco

**Solução:**
1. Verifique se a function foi deployada
2. Verifique os secrets (SERVICE_ROLE_KEY)
3. Verifique se o usuário está em `admin_users`

### Erro: "function admin_list_users does not exist"

**Causa:** Migration 015 não foi aplicada

**Solução:** Execute `supabase/migrations/015_admin_panel_enhancements.sql`

### Erro: "view admin_user_snapshot does not exist"

**Causa:** Migration 015 não foi aplicada completamente

**Solução:** Execute novamente a migration completa

### Nenhum usuário aparece na lista

**Causa:** Não há usuários com assinatura ou a view está vazia

**Solução:**
```sql
-- Verificar se há dados na view
SELECT COUNT(*) FROM public.admin_user_snapshot;

-- Se estiver vazio, verificar se há usuários
SELECT COUNT(*) FROM auth.users;

-- Verificar se há assinaturas
SELECT COUNT(*) FROM public.user_subscriptions;
```

## Arquivos Importantes

- **Edge Function:** `supabase/functions/admin-operations/index.ts`
- **Migration básica:** `supabase/migrations/014_create_admin_system.sql`
- **Migration avançada:** `supabase/migrations/015_admin_panel_enhancements.sql`
- **Script consolidado:** `scripts/apply-admin-system.sql`
- **Serviço frontend:** `services/adminService.ts`
- **Página admin:** `pages/AdminPanel.tsx`

## Comandos Úteis

```bash
# Deploy via CLI (se configurado)
npx supabase functions deploy admin-operations

# Ver logs da function
npx supabase functions logs admin-operations --follow

# Testar localmente
npx supabase functions serve admin-operations
```

---

**Última atualização:** Janeiro 2025
**Status:** Aguardando deploy da Edge Function atualizada
