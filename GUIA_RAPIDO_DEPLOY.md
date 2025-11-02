# 🚀 Guia Rápido: Deploy do Painel Admin

## Problema
A página `/admin` mostra "Unauthorized" e **não há logs** em Edge Functions.

## Causa
A Edge Function `admin-operations` não foi deployada no Supabase.

---

## ✅ SOLUÇÃO EM 3 PASSOS

### PASSO 1: Deploy da Edge Function

1. Acesse: **https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions**

2. Se `admin-operations` **NÃO EXISTE**:
   - Clique em **"New Function"**
   - Nome: `admin-operations`

3. Se `admin-operations` **JÁ EXISTE**:
   - Clique em `admin-operations`
   - Clique em **"Edit"**

4. **COPIE TODO O CÓDIGO** de `supabase/functions/admin-operations/index.ts`

5. **COLE** no editor da function

6. Clique em **"Deploy"**

---

### PASSO 2: Configurar Variáveis de Ambiente

1. Acesse: **https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/functions**

2. Na seção **"Environment Variables"**, adicione:

```
PROJECT_URL = https://keawapzxqoyesptwpwav.supabase.co
SERVICE_ROLE_KEY = <copie da página Settings > API>
```

**Para pegar o SERVICE_ROLE_KEY:**
- Vá em: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api
- Copie a chave **"service_role"** (NÃO a anon!)

---

### PASSO 3: Testar

1. Abra o navegador em: **https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations**

**Resultado esperado:**
- ✅ Erro 400 ou JSON = **FUNÇÃO ESTÁ FUNCIONANDO!**
- ❌ Timeout = **Função não foi deployada**

2. Faça login com `mariocromia@gmail.com`

3. Acesse `/admin`

4. **Se ainda der "Unauthorized"**, execute no SQL Editor:

```sql
-- Verificar se você está cadastrado como admin
SELECT * FROM public.admin_users WHERE email = 'mariocromia@gmail.com';

-- Se NÃO retornar nada, cadastrar:
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'mariocromia@gmail.com'
FROM auth.users
WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;
```

---

## ✅ Checklist Rápido

- [ ] Function `admin-operations` deployada no Dashboard
- [ ] Variáveis `PROJECT_URL` e `SERVICE_ROLE_KEY` configuradas
- [ ] Teste da URL responde (mesmo com erro 400)
- [ ] Usuário `mariocromia@gmail.com` cadastrado em `admin_users`
- [ ] Página `/admin` carrega sem erro

---

## 🆘 Ainda com problema?

Execute `scripts/verify-admin-setup.sql` no SQL Editor e me envie o resultado.

---

**Data:** 02 Nov 2025
**Status:** Pronto para deploy manual via Dashboard
