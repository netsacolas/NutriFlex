# 🔧 Correção: Erros na Edge Function Admin

## Problema Identificado

A Edge Function `admin-operations` **está deployada** (ping funciona com 401), mas apresenta erros:

**Erro 42804:**
> "Returned type character varying(255) does not match expected type"

**Erro 42702:**
> "It could refer to either a PL/pgSQL variable or a table column"

---

## Causa Raiz

Esses erros indicam que as **funções SQL no banco** (`admin_list_users`, `admin_get_plan_metrics`, etc.) estão com problemas de:

1. **Tipos incompatíveis** entre o que a função retorna e o que a Edge Function espera
2. **Ambiguidade** em nomes de colunas nas queries

**Isso significa que a migration 015 NÃO foi aplicada corretamente ou está incompleta.**

---

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Executar Diagnóstico Completo

1. Abra o **SQL Editor** do Supabase:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/sql/new

2. Copie e cole **TODO** o conteúdo de:
   ```
   scripts/diagnose-admin-complete.sql
   ```

3. Execute e **copie TODA a saída**

4. Me envie a saída completa (pode ser screenshot ou texto)

---

### PASSO 2: Aplicar Migration Completa

Se o diagnóstico mostrar que faltam funções ou a view, execute:

1. Abra o **SQL Editor** novamente

2. Copie e cole **TODO** o conteúdo de:
   ```
   scripts/apply-admin-system.sql
   ```

3. Execute

4. **IMPORTANTE:** Aguarde até aparecer "Success" no canto superior direito

5. Se der erro, **copie a mensagem exata do erro** e me envie

---

### PASSO 3: Verificar Variáveis de Ambiente

Mesmo com a função deployada, ela precisa das variáveis:

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/functions

2. Verifique se existem:
   ```
   PROJECT_URL = https://keawapzxqoyesptwpwav.supabase.co
   SERVICE_ROLE_KEY = (sua service_role key)
   ```

3. Se **NÃO existirem**, adicione:
   - Clique em "Add Environment Variable"
   - Nome: `PROJECT_URL`
   - Valor: `https://keawapzxqoyesptwpwav.supabase.co`
   - Clique em "Save"

   - Clique em "Add Environment Variable" novamente
   - Nome: `SERVICE_ROLE_KEY`
   - Valor: copie de https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api
     (é a chave "service_role", NÃO a "anon"!)
   - Clique em "Save"

4. **Importante:** Após adicionar, clique em "Redeploy" na Edge Function para aplicar as variáveis

---

### PASSO 4: Testar Novamente

Após aplicar os passos acima:

1. Faça **logout** da aplicação
2. Faça **login** novamente com `mariocromia@gmail.com`
3. Acesse: http://localhost:5173/test-admin-function.html
4. Clique nos botões na ordem:
   - 🏓 Testar Ping
   - 👤 Verificar Login
   - 🛡️ Verificar Admin
   - 📋 Listar Usuários
   - 📊 Buscar Métricas

5. **Me envie screenshot** de cada resultado

---

## 🔍 Entendendo os Erros

### Erro 42804 (Type Mismatch)

Significa que alguma função SQL está retornando um tipo diferente do esperado.

**Exemplo:**
- Função define retorno como `TEXT`
- Mas retorna `VARCHAR(255)`
- PostgreSQL reclama da incompatibilidade

**Solução:** Aplicar a migration correta que define os tipos corretos

### Erro 42702 (Ambiguous Column)

Significa que há ambiguidade em um nome de coluna.

**Exemplo:**
```sql
SELECT email FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE email = 'test@test.com'  -- ❌ Qual email? u.email ou p.email?
```

**Solução correta:**
```sql
WHERE u.email = 'test@test.com'  -- ✅ Especifica a tabela
```

A migration 015 já tem as correções para isso.

---

## 📋 Checklist de Verificação

Execute o diagnóstico e verifique se aparecem:

- [ ] ✅ "mariocromia@gmail.com CADASTRADO" na seção 1
- [ ] ✅ Pelo menos 10 funções listadas na seção 2
- [ ] ✅ "View existe" na seção 3
- [ ] ✅ 3 tabelas listadas na seção 4 (admin_users, admin_subscription_audit, admin_saved_segments)
- [ ] ✅ "Você é admin" na seção 5
- [ ] ✅ "Migration 014 Aplicada" na seção 10
- [ ] ✅ "Migration 015 Aplicada" na seção 11

Se qualquer item estiver ❌, a migration precisa ser aplicada.

---

## 🆘 Se Continuar com Erro

Execute o diagnóstico e me envie a saída completa, junto com:

1. Screenshot dos logs da Edge Function (última hora)
2. Screenshot da aba "Invocations" (se houver invocações com status 500)
3. Confirmação de que executou `apply-admin-system.sql` por completo

---

## 💡 Resumo

**Situação atual:**
- ✅ Edge Function deployada (responde ao ping)
- ❌ Funções SQL com erro de tipo/ambiguidade
- ❌ Provavelmente migration 015 incompleta

**Próximos passos:**
1. Executar `diagnose-admin-complete.sql`
2. Me enviar resultado
3. Executar `apply-admin-system.sql` se necessário
4. Configurar variáveis de ambiente
5. Testar novamente

---

**Data:** 02 Nov 2025, 15:30
**Status:** Aguardando diagnóstico SQL completo
