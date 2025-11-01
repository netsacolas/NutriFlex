# 🐛 Troubleshooting - Integração Kiwify

## 🔍 Ferramentas de Diagnóstico

Criamos 2 ferramentas para identificar problemas:

### 1. Diagnóstico Visual (HTML)
- **Arquivo**: `diagnostico-kiwify.html`
- **Como usar**: Abra no navegador
- **O que faz**: 6 testes visuais com resultados detalhados

### 2. Diagnóstico via Terminal (Node.js)
- **Arquivo**: `scripts/test-kiwify-integration.js`
- **Como usar**: `node scripts/test-kiwify-integration.js`
- **O que faz**: 5 testes automatizados com cores no terminal

---

## 📋 Checklist de Verificação Rápida

Execute estes comandos na ordem:

```bash
# 1. Verificar se Supabase CLI está instalado
supabase --version

# 2. Verificar se está vinculado ao projeto
supabase projects list

# 3. Ver status das Edge Functions
supabase functions list

# 4. Ver logs em tempo real
supabase functions logs kiwify-api --follow

# 5. Executar diagnóstico automatizado
node scripts/test-kiwify-integration.js
```

---

## ❌ Erros Comuns e Soluções

### Erro 1: "Unknown action: oauth_status"

**Mensagem completa:**
```json
{
  "error": "Ação desconhecida: oauth_status",
  "correlation_id": "..."
}
```

**Causa:**
- Edge Function não foi deployada OU
- Edge Function está com versão antiga (antes das alterações)

**Solução:**
```bash
# Deploy via CLI (RECOMENDADO)
supabase functions deploy kiwify-api

# Verificar se deployou
supabase functions list

# Ver logs para confirmar
supabase functions logs kiwify-api --follow
```

**Como confirmar que funcionou:**
- Execute o diagnóstico novamente
- Teste 4 deve mostrar "Action oauth_status: OK"

---

### Erro 2: "Variavel KIWIFY_ACCOUNT_ID nao configurada"

**Mensagem completa:**
```json
{
  "error": "Missing Kiwify credentials (KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET, KIWIFY_ACCOUNT_ID).",
  "correlation_id": "..."
}
```

**Causa:**
- Secrets não foram configurados no Supabase Vault OU
- Secrets foram configurados com nomes incorretos OU
- Aguardou menos de 30 segundos após salvar

**Solução:**

1. **Acesse o Vault:**
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. **Verifique se os 3 secrets existem com ESTES NOMES EXATOS:**
   - `KIWIFY_CLIENT_ID` (não Client_Id, não client_id)
   - `KIWIFY_CLIENT_SECRET` (não Client_Secret)
   - `KIWIFY_ACCOUNT_ID` (não Account_Id)

3. **Se não existirem, crie um por um:**

   Clique em "New secret" e adicione:

   **Secret 1:**
   ```
   Name: KIWIFY_CLIENT_ID
   Value: 4c7f47409-c212-45d1-aaf9-4a5d43dac808
   ```

   **Secret 2:**
   ```
   Name: KIWIFY_CLIENT_SECRET
   Value: 00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac
   ```

   **Secret 3:**
   ```
   Name: KIWIFY_ACCOUNT_ID
   Value: av8qNBGVVoyVD75
   ```

4. **IMPORTANTE:**
   - Aguarde 30-60 segundos após salvar
   - Não adicione espaços antes ou depois dos valores
   - Clique em "Save" após cada secret

5. **Teste novamente:**
   ```bash
   node scripts/test-kiwify-integration.js
   ```

**Como confirmar que funcionou:**
- Teste 3 deve mostrar "✅ Secrets configurados corretamente!"
- Deve exibir o Account ID e tempo de expiração do token

---

### Erro 3: "Invalid client credentials" ou 401

**Mensagem:**
```json
{
  "error": "Failed to obtain Kiwify OAuth token (401)."
}
```

**Causa:**
- Credenciais copiadas com espaço extra OU
- Credenciais incorretas OU
- Secret alterado acidentalmente

**Solução:**

1. **Delete os 3 secrets existentes no Vault**

2. **Adicione novamente copiando EXATAMENTE:**
   - Use Ctrl+C / Ctrl+V para copiar os valores
   - NÃO digite manualmente
   - Verifique se não tem espaço no início ou fim

3. **Teste direto com a API Kiwify:**
   ```bash
   curl -X POST https://public-api.kiwify.com/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "client_credentials",
       "client_id": "4c7f47409-c212-45d1-aaf9-4a5d43dac808",
       "client_secret": "00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac"
     }'
   ```

   **Resposta esperada:**
   ```json
   {
     "access_token": "eyJ...",
     "token_type": "Bearer",
     "expires_in": 3600
   }
   ```

4. **Se o curl funcionar mas a Edge Function não:**
   - Problema está nos Secrets do Supabase
   - Reconfigure os secrets com atenção aos espaços

---

### Erro 4: Edge Function não responde ou timeout

**Sintomas:**
- Requisições demoram muito e falham
- Error: "Failed to fetch"
- Timeout após 30+ segundos

**Causa:**
- Edge Function não foi deployada OU
- Problema de rede/DNS OU
- Edge Function com erro fatal que impede execução

**Diagnóstico:**

1. **Verificar se a função existe:**
   ```bash
   supabase functions list
   ```
   Deve aparecer `kiwify-api` na lista.

2. **Ver logs em tempo real:**
   ```bash
   supabase functions logs kiwify-api --follow
   ```

3. **Fazer requisição e observar logs:**
   Abra `diagnostico-kiwify.html` e clique em "Testar Conexão"
   Observe os logs no terminal

**Solução:**

1. **Redeploy da função:**
   ```bash
   supabase functions deploy kiwify-api --no-verify-jwt
   ```

2. **Verificar imports:**
   ```bash
   # Verificar se _shared está incluído
   ls supabase/functions/_shared/
   ```
   Deve conter: `kiwifyClient.ts`, `logger.ts`

3. **Deploy com debug:**
   ```bash
   supabase functions deploy kiwify-api --debug
   ```

---

### Erro 5: "fetchProducts is not a function"

**Mensagem no log:**
```
TypeError: client.fetchProducts is not a function
```

**Causa:**
- Deploy não incluiu o arquivo `_shared/kiwifyClient.ts` atualizado OU
- Cache da função com versão antiga

**Solução:**

1. **Verificar se o método existe no código:**
   ```bash
   grep -n "fetchProducts" supabase/functions/_shared/kiwifyClient.ts
   ```
   Deve retornar a linha onde o método está definido.

2. **Deploy forçando atualização:**
   ```bash
   # Deploy incluindo _shared
   supabase functions deploy kiwify-api --no-verify-jwt

   # Se não funcionar, delete e recrie
   supabase functions delete kiwify-api
   supabase functions deploy kiwify-api
   ```

3. **Verificar no Dashboard:**
   - Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
   - Clique em `kiwify-api`
   - Veja o timestamp do "Last deployed"
   - Deve ser recente (hoje)

---

### Erro 6: CORS ou "No 'Access-Control-Allow-Origin' header"

**Mensagem:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Causa:**
- Edge Function não retorna headers CORS OU
- Requisição OPTIONS não está sendo tratada

**Solução:**

1. **Verificar CORS headers na função:**
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

2. **Garantir que OPTIONS retorna 200:**
   ```typescript
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
   ```

3. **Testar no navegador:**
   - Abra DevTools (F12)
   - Aba Network
   - Faça requisição
   - Veja se OPTIONS retornou 200
   - Veja headers da resposta POST

---

## 🔧 Comandos Úteis de Debug

### Ver logs em tempo real
```bash
supabase functions logs kiwify-api --follow
```

### Ver últimos erros
```bash
supabase functions logs kiwify-api --tail 50
```

### Filtrar logs por erro
```bash
supabase functions logs kiwify-api | grep ERROR
```

### Testar função localmente (se possível)
```bash
supabase functions serve kiwify-api --env-file supabase/.env.local
```

### Verificar secrets configurados
```bash
# Não mostra valores, só nomes
supabase secrets list
```

### Deploy com logs detalhados
```bash
supabase functions deploy kiwify-api --debug
```

---

## 📊 Fluxo de Debug Recomendado

```
1. Executar diagnóstico automatizado
   ↓
   node scripts/test-kiwify-integration.js
   ↓
2. Identificar qual teste falhou
   ↓
   [Teste 1 falhou?] → Edge Function não deployada
   [Teste 2 falhou?] → Credenciais Kiwify inválidas
   [Teste 3 falhou?] → Secrets não configurados
   [Teste 4 falhou?] → Action list_products não existe
   [Teste 5 falhou?] → Edge Function com versão antiga
   ↓
3. Aplicar solução específica (veja acima)
   ↓
4. Testar novamente
   ↓
5. Se todos passarem → Testar compra real
```

---

## 🆘 Se Nada Funcionar

Se após seguir todos os passos ainda houver erro:

1. **Colete informações:**
   ```bash
   # Executar diagnóstico e salvar output
   node scripts/test-kiwify-integration.js > debug-output.txt 2>&1

   # Ver logs da função
   supabase functions logs kiwify-api --tail 100 > function-logs.txt

   # Listar secrets (não mostra valores)
   supabase secrets list > secrets-list.txt
   ```

2. **Abra o arquivo HTML de diagnóstico:**
   - `diagnostico-kiwify.html`
   - Clique em "Executar Todos os Testes"
   - Clique em "Copiar Resultados"

3. **Me envie:**
   - O output do diagnóstico (texto copiado)
   - O arquivo `debug-output.txt`
   - O arquivo `function-logs.txt`
   - Screenshot do Supabase Vault mostrando os 3 secrets (sem mostrar valores)

---

## ✅ Como Confirmar que Está Tudo Funcionando

Quando tudo estiver OK, você deve ver:

### No diagnóstico automatizado:
```
✅ TESTE 1: Conectividade com Edge Function - OK
✅ TESTE 2: OAuth Direto com Kiwify API - OK
✅ TESTE 3: Verificar Secrets no Supabase - OK
✅ TESTE 4: Listar Produtos via Edge Function - OK
✅ TESTE 5: Verificar Versão da Edge Function - OK

Total: 5 | Aprovados: 5 | Falharam: 0
TODOS OS TESTES PASSARAM! 🎉
```

### No HTML:
- 6 badges verdes com "✓ OK"
- Resumo: "Aprovados: 6 | Falharam: 0"

### Teste de compra real:
1. Acesse `/assinatura` no app
2. Clique em um plano
3. Complete o checkout na Kiwify
4. Aguarde 1-2 minutos
5. Verifique no banco:
   ```sql
   SELECT * FROM user_subscriptions
   WHERE plan != 'free'
   ORDER BY updated_at DESC;
   ```
6. Deve aparecer sua assinatura

---

**Última atualização**: 2025-01-11
**Versão**: 1.0.0
