# = Deploy da Edge Function - Gemini Proxy

Este documento contm instrues completas para fazer deploy da Edge Function que funciona como proxy seguro para a API do Gemini.

---

## Pr-requisitos

1. **Supabase CLI instalado**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase

   # Verificar instalao
   supabase --version
   ```

2. **Conta no Supabase**
   - Ter acesso ao projeto: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav

3. **Chave da API do Gemini**
   - Criar nova chave em: https://aistudio.google.com/app/apikey
   - **IMPORTANTE:** Revogar a chave antiga que foi exposta

---

## Passo 1: Executar Migrao do Banco de Dados

A Edge Function precisa de uma tabela para fazer rate limiting.

1. Acesse o SQL Editor do Supabase:
   https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/sql

2. Execute o contedo do arquivo:
   `migrations/005_add_gemini_requests_table.sql`

3. Verifique que a tabela foi criada:
   ```sql
   SELECT * FROM public.gemini_requests LIMIT 1;
   ```

---

## Passo 2: Configurar Secrets no Supabase

A chave da API do Gemini deve ficar guardada como um "secret" no Supabase, nunca no cdigo.

### Via Dashboard (Mais fcil)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/settings/vault
2. Clique em **"New Secret"**
3. Preencha:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Cole sua NOVA chave da API do Gemini
4. Clique em **"Add secret"**

### Via CLI (Alternativa)

```bash
# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref keawapzxqoyesptpwpwav

# Adicionar secret
supabase secrets set GEMINI_API_KEY=sua_nova_chave_aqui
```

---

## Passo 3: Deploy da Edge Function

### Via Dashboard (Mais simples)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/functions
2. Clique em **"Deploy new function"**
3. Preencha:
   - **Function name**: `gemini-proxy`
   - **Code**: Copie todo o contedo de `supabase/functions/gemini-proxy/index.ts`
4. Clique em **"Deploy function"**
5. Copie a URL da funo (ser algo como: `https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy`)

### Via CLI (Recomendado para atualizaes futuras)

```bash
# 1. Login (se ainda no fez)
supabase login

# 2. Link ao projeto (se ainda no fez)
supabase link --project-ref keawapzxqoyesptpwpwav

# 3. Deploy da funo
supabase functions deploy gemini-proxy

# 4. A URL ser mostrada no terminal
# Exemplo: https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy
```

---

## Passo 4: Atualizar o Frontend

Agora que a Edge Function est no ar, precisamos atualizar o cdigo do frontend para us-la em vez de chamar o Gemini diretamente.

### O que fazer:

1. **Criar novo servio**: `services/geminiProxyService.ts`
2. **Atualizar**: `services/geminiService.ts` para usar o proxy
3. **Remover**: `VITE_GEMINI_API_KEY` do `.env.local` (no  mais necessrio no frontend)

**NOTA:** Vou criar esses arquivos nos prximos passos aps confirmar que a Edge Function est funcionando.

---

## Passo 5: Testar a Edge Function

### Teste Manual via cURL

```bash
# 1. Fazer login e obter token
# (Voc precisar do token de um usurio autenticado)

# 2. Testar a funo
curl -X POST \
  'https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy' \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "mealType": "lunch",
    "targetCalories": 600,
    "foods": ["arroz integral", "frango grelhado", "brcolis"]
  }'
```

### Teste via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/functions
2. Clique na funo `gemini-proxy`
3. Clique em **"Invoke function"**
4. Cole o JSON de teste:
   ```json
   {
     "mealType": "lunch",
     "targetCalories": 600,
     "foods": ["arroz integral", "frango grelhado", "brcolis"]
   }
   ```
5. Clique em **"Invoke"**
6. Verifique a resposta

---

## Passo 6: Monitorar Logs

### Ver logs em tempo real:

```bash
supabase functions logs gemini-proxy --follow
```

### Ver logs no Dashboard:

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/functions
2. Clique em `gemini-proxy`
3. Aba **"Logs"**

---

## Resoluo de Problemas

### Erro: "API key missing"

**Causa:** O secret `GEMINI_API_KEY` no foi configurado ou no est acessvel pela funo.

**Soluo:**
```bash
# Verificar secrets existentes
supabase secrets list

# Se no aparecer, adicionar novamente
supabase secrets set GEMINI_API_KEY=sua_chave_aqui

# Fazer redeploy
supabase functions deploy gemini-proxy
```

### Erro: "Unauthorized"

**Causa:** Token de autenticao invlido ou ausente.

**Soluo:**
- Verificar que o header `Authorization: Bearer TOKEN` est sendo enviado
- Verificar que o usurio est autenticado no frontend
- Testar com um token novo (fazer login novamente)

### Erro: "Rate limit exceeded"

**Causa:** Usurio fez mais de 20 requisies na ltima hora.

**Soluo:**
-  um comportamento esperado (segurana)
- Esperar 1 hora ou ajustar o limite no cdigo da funo (linha 82)
- Para desenvolvimento, pode aumentar temporariamente para 100

### Erro: "CORS"

**Causa:** Configurao de CORS incorreta.

**Soluo:**
- Verificar que as linhas 18-21 do cdigo tm os headers corretos
- Verificar que a funo retorna `corsHeaders` em TODAS as respostas

---

## Segurana Implementada

 **Autenticao**: S usurios logados podem chamar
 **Rate Limiting**: Mximo 20 requisies/hora por usurio
 **Validao de Input**: Calorias entre 50-10000, 1-20 alimentos
 **API Key no servidor**: Nunca exposta ao cliente
 **CORS configurado**: Aceita requisies do frontend
 **RLS ativado**: Usurios s veem suas prprias requisies

---

## Custos Estimados

### Edge Functions (Supabase)
- **Free Tier**: 500,000 invocations/ms
- **Pro Plan**: 2,000,000 invocations/ms inclusos
- **Custo adicional**: $2 por 1M invocations

### Gemini API (Google)
- **Free Tier**: 1,500 requests/dia
- **Acima disso**: Varia por modelo
- **gemini-2.0-flash-exp**: Geralmente gratuito em preview

Com 100 usurios ativos fazendo 20 clculos/ms cada:
- **Total**: 2,000 requests/ms
- **Custo Edge Functions**: $0 (dentro do free tier)
- **Custo Gemini API**: $0 (dentro do free tier)

---

## Prximos Passos

Aps confirmar que a Edge Function est funcionando:

1.  Criar `services/geminiProxyService.ts`
2.  Atualizar frontend para usar o proxy
3.  Remover `VITE_GEMINI_API_KEY` do `.env.local` e `.env.example`
4.  Testar fluxo completo no frontend
5.  Monitorar logs por alguns dias

---

## Comandos teis

```bash
# Ver status do link com o projeto
supabase status

# Listar funes deployed
supabase functions list

# Fazer redeploy aps alteraes
supabase functions deploy gemini-proxy

# Ver logs em tempo real
supabase functions logs gemini-proxy --follow

# Deletar funo (cuidado!)
supabase functions delete gemini-proxy
```

---

**Dvidas?**
- Docs Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Docs Gemini API: https://ai.google.dev/docs

---

**Criado em**: 2025-10-25
**ltima atualizao**: 2025-10-25

## Kiwify API

1. Configure no Vault: `KIWIFY_CLIENT_ID`, `KIWIFY_CLIENT_SECRET`, `KIWIFY_ACCOUNT_ID`, `KIWIFY_PLAN_*_ID`.
2. Execute `supabase functions deploy kiwify-api kiwify-sync --project-ref <PROJETO>`.
3. Agende o job incremental: `supabase functions schedule create --cron '*/15 * * * *' kiwify-sync`.
4. Teste manual: `supabase functions invoke kiwify-api --body '{"action":"oauth_status"}'` e `supabase functions invoke kiwify-sync` (janela 24h).
5. Monitore logs com `supabase functions logs kiwify-api --follow` e `supabase functions logs kiwify-sync --follow`.

**Atualizado em**: 2025-11-03
