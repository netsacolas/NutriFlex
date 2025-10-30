# 🔐 Configuração Segura das Credenciais Kiwify

## ⚠️ SEGURANÇA CRÍTICA

**NUNCA** adicione as credenciais Kiwify em:
- ❌ Variáveis de ambiente VITE_* (expõe no frontend)
- ❌ Arquivos .env commitados no Git
- ❌ Código-fonte TypeScript/JavaScript
- ❌ Comentários ou documentação pública

**SEMPRE** configure as credenciais em:
- ✅ Supabase Secrets Vault (backend seguro)
- ✅ Edge Functions (executam no servidor)

---

## 📋 Passo a Passo: Configuração no Supabase

### 1. Acessar Supabase Vault

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
2. Faça login com sua conta Supabase
3. Navegue até: **Settings → Vault → Secrets**

### 2. Adicionar Credenciais Kiwify

Clique em **"New Secret"** para cada credencial:

#### Secret 1: Client ID
- **Name:** `KIWIFY_CLIENT_ID`
- **Value:** `190fbd3d-baa1-47b0-aa42-686e4feb8932`
- Clique em **"Create Secret"**

#### Secret 2: Client Secret
- **Name:** `KIWIFY_CLIENT_SECRET`
- **Value:** `78b45eccd73c25be808b83389ba51fff815f3ee62af5695bc37cdf9c754e311f`
- Clique em **"Create Secret"**

#### Secret 3: Account ID
- **Name:** `KIWIFY_ACCOUNT_ID`
- **Value:** `av8qNBGVVoyVD75`
- Clique em **"Create Secret"**

### 3. Verificar Configuração

Execute via Supabase CLI:

```bash
supabase secrets list --project-ref keawapzxqoyesptwpwav
```

**Saída esperada:**
```
KIWIFY_CLIENT_ID
KIWIFY_CLIENT_SECRET
KIWIFY_ACCOUNT_ID
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 Deploy da Edge Function

### 1. Fazer Deploy da Função `kiwify-api`

```bash
cd ~/projetos/nutrimais

# Deploy da função
supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav

# Verificar logs
supabase functions logs kiwify-api --tail
```

### 2. Testar a Função

#### Teste 1: Autenticação (Access Token)

```bash
# A função automaticamente obterá o token usando as credenciais do Vault
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -d '{
    "action": "list_subscriptions",
    "external_id": "user-uuid-123"
  }'
```

#### Teste 2: Listar Assinaturas

```bash
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_subscriptions",
    "user_id": "uuid-do-usuario"
  }'
```

---

## 🔒 Validação de Segurança

### Checklist de Segurança

- [ ] Credenciais configuradas **APENAS** no Supabase Vault
- [ ] `.env.local` **NÃO** contém credenciais Kiwify API
- [ ] Arquivo `.env.example` contém apenas placeholders
- [ ] Edge Function `kiwify-api` deployada com sucesso
- [ ] Logs não exibem secrets (client_secret, tokens)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo

### Verificar se Credenciais NÃO Estão Expostas

```bash
# Verificar no código-fonte
grep -r "KIWIFY_CLIENT_SECRET" . --exclude-dir=node_modules
grep -r "78b45ecc" . --exclude-dir=node_modules

# Não deve retornar nada além de comentários em .env.example
```

---

## 🔄 Fluxo de Uso Seguro

### Frontend → Edge Function → Kiwify API

```mermaid
sequenceDiagram
    Frontend->>Edge Function: POST /kiwify-api {action, user_id}
    Edge Function->>Supabase Vault: Buscar KIWIFY_CLIENT_ID/SECRET
    Edge Function->>Kiwify API: OAuth Token Request
    Kiwify API-->>Edge Function: Access Token
    Edge Function->>Kiwify API: GET /subscriptions (Bearer Token)
    Kiwify API-->>Edge Function: Subscription Data
    Edge Function-->>Frontend: Response (sem secrets)
```

**Segurança:**
- ✅ Frontend nunca vê credentials
- ✅ Tokens não são expostos ao cliente
- ✅ Edge Function valida autenticação Supabase

---

## 🧪 Testes de Integração

### Criar Serviço Frontend para Kiwify API

**Arquivo:** `services/kiwifyApiService.ts`

```typescript
import { supabase } from './supabaseClient';

export const kiwifyApiService = {
  async listSubscriptions(userId: string) {
    const { data, error } = await supabase.functions.invoke('kiwify-api', {
      body: {
        action: 'list_subscriptions',
        user_id: userId
      }
    });

    if (error) throw error;
    return data;
  },

  async cancelSubscription(subscriptionId: string, userId: string) {
    const { data, error } = await supabase.functions.invoke('kiwify-api', {
      body: {
        action: 'cancel_subscription',
        subscription_id: subscriptionId,
        user_id: userId
      }
    });

    if (error) throw error;
    return data;
  },

  async syncSubscription(userId: string) {
    const { data, error } = await supabase.functions.invoke('kiwify-api', {
      body: {
        action: 'sync_subscription',
        user_id: userId
      }
    });

    if (error) throw error;
    return data;
  }
};
```

---

## 📊 Monitoramento

### Logs da Edge Function

```bash
# Logs em tempo real
supabase functions logs kiwify-api --tail --project-ref keawapzxqoyesptwpwav

# Filtrar por erro
supabase functions logs kiwify-api | grep ERROR
```

### Métricas de Uso

Monitore no Supabase Dashboard:
- Número de invocações
- Taxa de erro
- Tempo de resposta
- Cache hits (access token)

---

## 🆘 Troubleshooting

### Erro: "Kiwify credentials not configured"

**Causa:** Secrets não configurados no Vault

**Solução:**
1. Verificar: `supabase secrets list`
2. Adicionar secrets faltantes
3. Redeploy: `supabase functions deploy kiwify-api`

### Erro: "Failed to get Kiwify token: 401"

**Causa:** Credenciais inválidas

**Solução:**
1. Verificar credenciais na dashboard Kiwify
2. Atualizar secrets no Vault
3. Limpar cache (restart da função)

### Erro: "Subscription not found or unauthorized"

**Causa:** Tentativa de cancelar assinatura de outro usuário

**Solução:**
- Verificar se `user_id` corresponde ao dono da assinatura
- Validar `kiwify_subscription_id` na tabela `user_subscriptions`

---

## 🔄 Rotação de Credenciais

### Quando Rotacionar

- 🔴 Credenciais vazaram (commit acidental, log exposto)
- 🟡 Periodicament e (a cada 90 dias)
- 🟢 Membro da equipe saiu

### Como Rotacionar

1. Gerar novas credenciais na Kiwify Dashboard
2. Atualizar secrets no Supabase Vault
3. Redeploy das Edge Functions
4. Invalidar token em cache (restart)
5. Monitorar logs por 24h

---

## 📞 Contatos de Suporte

- **Kiwify API:** developers@kiwify.com.br
- **Supabase:** support@supabase.com
- **Documentação Kiwify:** https://developers.kiwify.com.br

---

**LEMBRETE FINAL:** 🔐 **NUNCA commite credenciais reais no Git!**

**Data de criação:** 2025-01-30
**Responsável:** Sistema de segurança NutriMais
