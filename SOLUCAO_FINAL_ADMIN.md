# 🚨 SOLUÇÃO DEFINITIVA: Edge Function Não Está Deployada

## Problema Confirmado

**Sintoma:** Não há logs em Edge Functions → Invocations
**Causa:** A Edge Function `admin-operations` **NÃO FOI DEPLOYADA** ou está com código antigo

## ✅ SOLUÇÃO GARANTIDA (3 Passos)

### PASSO 1: Verificar se a função existe no Supabase

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Procure por `admin-operations` na lista

**Cenário A - Function NÃO existe:**
- Clique em "New Function"
- Nome: `admin-operations`
- Copie TODO o código de `supabase/functions/admin-operations/index.ts`
- Clique em "Deploy"

**Cenário B - Function existe mas está desatualizada:**
- Clique em `admin-operations`
- Clique em "Edit"
- **DELETE TODO O CÓDIGO ANTIGO**
- Cole o código NOVO de `supabase/functions/admin-operations/index.ts`
- Clique em "Deploy"

### PASSO 2: Configurar Environment Variables (CRÍTICO!)

A função precisa de variáveis de ambiente. Sem elas, ela NÃO FUNCIONA.

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/functions

2. Na seção "Environment Variables", adicione:

```
PROJECT_URL = https://keawapzxqoyesptwpwav.supabase.co
SERVICE_ROLE_KEY = (copie da página Settings > API)
```

**Para pegar o SERVICE_ROLE_KEY:**
- Vá em: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api
- Copie a chave "service_role" (NÃO a anon!)
- Cole no campo SERVICE_ROLE_KEY

⚠️ **SEM ESSAS VARIÁVEIS A FUNÇÃO NÃO FUNCIONA!**

### PASSO 3: Testar a função diretamente

Após o deploy, teste se a função responde:

**Teste 1: Ping básico**

Abra o navegador e acesse:
```
https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations
```

**Resultado esperado:**
- Status 400 ou erro JSON (isso é NORMAL - significa que a função está respondendo!)
- Se der timeout ou erro de conexão = função NÃO foi deployada

**Teste 2: Via console do navegador**

1. Abra a aplicação
2. Faça login com `mariocromia@gmail.com`
3. Abra o DevTools (F12)
4. Cole no Console:

```javascript
// Pegar token
const session = await (await fetch('https://keawapzxqoyesptwpwav.supabase.co/auth/v1/user', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8',
    'Authorization': 'Bearer ' + localStorage.getItem('sb-keawapzxqoyesptwpwav-auth-token')
  }
})).json();

// Testar função
const response = await fetch('https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8',
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('sb-keawapzxqoyesptwpwav-auth-token')).access_token
  },
  body: JSON.stringify({ action: 'get_metrics', type: 'plan' })
});

console.log(await response.json());
```

**Resultado esperado:**
```json
{
  "plans": [
    {"metric": "free", "total": X}
  ]
}
```

**Se der erro "Unauthorized" ou "Forbidden":**
- Significa que a função ESTÁ funcionando mas o usuário não está em `admin_users`
- Execute a query do Passo 4

### PASSO 4: Garantir que mariocromia@gmail.com está cadastrado

No SQL Editor, execute:

```sql
-- 1. Verificar se existe
SELECT * FROM public.admin_users WHERE email = 'mariocromia@gmail.com';

-- 2. Se NÃO retornar nada, inserir:
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'mariocromia@gmail.com'
FROM auth.users
WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- 3. Verificar novamente
SELECT
  au.email,
  admin.id as admin_registered
FROM auth.users au
LEFT JOIN public.admin_users admin ON admin.user_id = au.id
WHERE au.email = 'mariocromia@gmail.com';
```

**Resultado esperado:**
```
email                    | admin_registered
mariocromia@gmail.com   | <UUID> (NÃO PODE SER NULL!)
```

## 📋 Checklist Final

Execute cada item E CONFIRME:

- [ ] **Function deployada:** Existe em Functions > admin-operations
- [ ] **Variáveis configuradas:** PROJECT_URL e SERVICE_ROLE_KEY em Settings > Functions
- [ ] **Teste de ping:** URL da function responde (mesmo que com erro 400)
- [ ] **Usuário cadastrado:** Query retorna UUID em admin_registered
- [ ] **View criada:** `SELECT COUNT(*) FROM admin_user_snapshot` funciona
- [ ] **Funções criadas:** `SELECT count(*) FROM information_schema.routines WHERE routine_name LIKE 'admin%'` retorna 10+

## 🔍 Debug Adicional

### Ver logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/admin-operations/logs

2. Se não aparecer NADA → Função não está sendo chamada

3. Se aparecer erros → Copie e cole aqui para diagnosticar

### Forçar rebuild da função

1. Vá em Functions > admin-operations
2. Clique em "..." (três pontinhos)
3. Clique em "Redeploy"
4. Aguarde 30 segundos
5. Teste novamente

## ⚠️ Problemas Comuns

### "Function not found"
**Causa:** Nome errado ou não deployada
**Solução:** Deploy novamente com nome exato `admin-operations`

### "Missing env vars"
**Causa:** SERVICE_ROLE_KEY não configurada
**Solução:** Adicionar em Settings > Functions > Environment Variables

### "Unauthorized"
**Causa:** Usuário não está em admin_users
**Solução:** Executar INSERT do Passo 4

### "Network error"
**Causa:** URL errada ou CORS
**Solução:** Verificar se URL é `https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations`

## 🆘 Última Tentativa

Se NADA funcionar, faça um deploy LIMPO:

1. **Delete a função existente** (se existir)
2. **Crie nova função** do zero com nome `admin-operations`
3. **Cole o código** de `supabase/functions/admin-operations/index.ts`
4. **Configure as variáveis** (PROJECT_URL + SERVICE_ROLE_KEY)
5. **Deploy**
6. **Aguarde 1 minuto**
7. **Teste com curl:**

```bash
curl -X POST \
  'https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8' \
  -d '{"action": "get_metrics"}'
```

**Se retornar erro de autenticação = SUCESSO!** (função está respondendo)
**Se retornar timeout = FALHA** (função não foi deployada)

---

**Data:** 02 Nov 2025, 12:10
**Status:** Aguardando deploy manual da Edge Function no Dashboard
**Prioridade:** 🔴 CRÍTICA - Sem isso o painel admin não funciona
