# 🖥️ Comandos para Executar no Servidor

Copie e cole estes comandos no servidor Linux onde está o projeto:

## 1️⃣ Login (use o token que você já tem)

```bash
npx supabase login --token sbp_5eb242df6cf6ad87fcebb50038ca3e68a954d540
```

## 2️⃣ Deploy da função kiwify-sync

```bash
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav
```

## 3️⃣ Verificar Secrets configurados

```bash
npx supabase secrets list --project-ref keawapzxqoyesptwpwav
```

Deve mostrar:
```
NAME
KIWIFY_ACCOUNT_ID
KIWIFY_CLIENT_ID
KIWIFY_CLIENT_SECRET
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

## 4️⃣ Ver logs da função kiwify-api

```bash
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 10
```

Procure por erros!

## 5️⃣ Testar a função diretamente

```bash
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}'
```

Se funcionar, deve retornar algo como:
```json
{
  "token_valid": true,
  "expires_at": 1234567890,
  "source": "api"
}
```

Se der erro, vai mostrar:
```json
{
  "error": "Erro interno...",
  "correlation_id": "..."
}
```

---

## 🔧 Troubleshooting

### Se ainda der erro "Erro interno"

O problema pode ser que o `KIWIFY_CLIENT_SECRET` não está completo ou tem espaços.

Verifique o secret:

```bash
npx supabase secrets list --project-ref keawapzxqoyesptwpwav
```

Se suspeitar que está errado, configure novamente:

```bash
npx supabase secrets set KIWIFY_CLIENT_SECRET="00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac03401" --project-ref keawapzxqoyesptwpwav
```

⚠️ **ATENÇÃO**: Use o CLIENT_SECRET completo da imagem que você enviou!

Depois, redeploy:

```bash
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
```

---

## 📋 Resumo dos Comandos (copie tudo de uma vez)

```bash
# Login
npx supabase login --token sbp_5eb242df6cf6ad87fcebb50038ca3e68a954d540

# Deploy kiwify-sync
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav

# Verificar secrets
npx supabase secrets list --project-ref keawapzxqoyesptwpwav

# Ver logs
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 10

# Testar
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}'
```

---

## 🎯 Próximo Passo

Depois que tudo funcionar no servidor, volte para a máquina local e teste:

👉 http://localhost:3001/test-kiwify-oauth.html

Deve mostrar "✅ Autenticação OAuth VÁLIDA"
