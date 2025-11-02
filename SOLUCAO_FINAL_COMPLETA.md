# 🎯 SOLUÇÃO FINAL: Identificar e Corrigir Erro 500

## Situação Atual

✅ Edge Function deployada e respondendo
✅ 10 funções SQL criadas
✅ Métricas funcionando (get_metrics OK)
❌ Listagem de usuários com erro 500

## 🔍 PASSO 1: Ver Logs COMPLETOS da Edge Function

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/admin-operations/logs

2. Configure para "Last hour"

3. **Clique em "Logs" (não em "Invocations"!)**

4. Procure por linhas com **"Admin operation error:"**

5. **Me envie a mensagem completa do erro**

Deve aparecer algo como:
```
Admin operation error: column "phone" does not exist
```

OU

```
Admin operation error: Acesso restrito a administradores
```

---

## 🔍 PASSO 2: Executar Teste SQL Simples

1. Abra SQL Editor

2. Execute este script:

```sql
-- Pegar seu user_id primeiro
SELECT id FROM auth.users WHERE email = 'mariocromia@gmail.com';

-- Depois teste a função (cole o user_id abaixo)
DO $$
DECLARE
  v_user_id UUID := 'SEU_USER_ID_AQUI'; -- COLE O UUID DO SELECT ACIMA!
BEGIN
  PERFORM public.admin_list_users(
    p_admin_user := v_user_id,
    p_search := NULL,
    p_plans := NULL,
    p_status := NULL,
    p_due_in_days := NULL,
    p_start_from := NULL,
    p_start_to := NULL,
    p_end_from := NULL,
    p_end_to := NULL,
    p_sort_field := 'name',
    p_sort_direction := 'asc',
    p_page := 1,
    p_page_size := 25
  );

  RAISE NOTICE 'SUCCESS!';

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERRO: %', SQLERRM;
END $$;
```

3. **Me envie a mensagem de erro** (se houver)

---

## 🔍 PASSO 3: Ver Erro no Console (Alternativa)

1. Abra http://localhost:3001/admin

2. **F12** > Console

3. Procure por **"Error:"** em vermelho

4. Expanda o erro e **copie a mensagem completa**

---

## 💡 Possíveis Problemas e Soluções

### Problema 1: Campo "phone" não existe

**Erro esperado:**
```
column "phone" does not exist
```

**Solução:**
Remover campo `phone` da view `admin_user_snapshot`

---

### Problema 2: Permissão negada

**Erro esperado:**
```
permission denied for table admin_users
```

**Solução:**
Ajustar políticas RLS

---

### Problema 3: Função não tem permissão

**Erro esperado:**
```
Acesso restrito a administradores
```

**Solução:**
Cadastrar `mariocromia@gmail.com` em `admin_users`

---

### Problema 4: Tipo incompatível

**Erro esperado:**
```
cannot cast type ... to ...
```

**Solução:**
Ajustar tipos na função SQL

---

## 📋 O Que Eu Preciso

**Escolha QUALQUER UM destes:**

1. ✅ **Logs da Edge Function** (aba "Logs", não "Invocations")

OU

2. ✅ **Resultado do teste SQL** (mensagem de erro)

OU

3. ✅ **Console do navegador** (mensagem de erro expandida)

---

## 🚀 Assim que Tiver a Mensagem

Vou:
1. Identificar a causa exata
2. Criar a correção específica
3. Você aplicar e funcionar!

---

**Arquivo de teste SQL:** `scripts/test-simples.sql`

**Me envie qualquer uma das 3 opções acima!** 🙏
