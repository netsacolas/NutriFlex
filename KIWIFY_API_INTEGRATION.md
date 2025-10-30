# Integração com API Kiwify - Guia Completo

## 🔐 Credenciais (NUNCA COMMITAR)

As credenciais da API Kiwify devem ser configuradas **APENAS** no Supabase Secrets Vault:

```bash
KIWIFY_CLIENT_ID=seu_client_id_aqui
KIWIFY_CLIENT_SECRET=seu_client_secret_aqui
KIWIFY_ACCOUNT_ID=seu_account_id_aqui
```

## 📋 Configuração no Supabase

### 1. Adicionar Secrets no Vault

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
2. Clique em "New Secret" e adicione cada uma:

| Name | Value | Descrição |
|------|-------|-----------|
| `KIWIFY_CLIENT_ID` | (seu client_id) | ID do cliente OAuth |
| `KIWIFY_CLIENT_SECRET` | (seu client_secret) | Secret OAuth (nunca expor) |
| `KIWIFY_ACCOUNT_ID` | (seu account_id) | ID da conta Kiwify |

### 2. Verificar Secrets Configurados

```bash
# Via Supabase CLI
supabase secrets list

# Deve retornar:
# KIWIFY_CLIENT_ID
# KIWIFY_CLIENT_SECRET
# KIWIFY_ACCOUNT_ID
```

## 🔌 Endpoints da API Kiwify

### Base URL
```
https://api.kiwify.com.br
```

### Autenticação OAuth 2.0

#### 1. Obter Access Token

```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "{{KIWIFY_CLIENT_ID}}",
  "client_secret": "{{KIWIFY_CLIENT_SECRET}}"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Endpoints Disponíveis

#### Listar Assinaturas
```http
GET /v1/subscriptions
Authorization: Bearer {{access_token}}
```

#### Obter Detalhes de Assinatura
```http
GET /v1/subscriptions/{subscription_id}
Authorization: Bearer {{access_token}}
```

#### Cancelar Assinatura
```http
DELETE /v1/subscriptions/{subscription_id}
Authorization: Bearer {{access_token}}
```

#### Obter Pedidos
```http
GET /v1/orders
Authorization: Bearer {{access_token}}
```

## 🛠️ Edge Functions

### Função: `kiwify-api`

Centraliza toda comunicação com a API Kiwify de forma segura.

**Endpoints:**

#### 1. Verificar Status de Assinatura
```http
POST /functions/v1/kiwify-api
Content-Type: application/json
Authorization: Bearer {{supabase_anon_key}}

{
  "action": "get_subscription",
  "subscription_id": "sub_xxx"
}
```

#### 2. Listar Assinaturas do Usuário
```http
POST /functions/v1/kiwify-api
Content-Type: application/json

{
  "action": "list_subscriptions",
  "user_id": "uuid"
}
```

#### 3. Cancelar Assinatura
```http
POST /functions/v1/kiwify-api
Content-Type: application/json

{
  "action": "cancel_subscription",
  "subscription_id": "sub_xxx",
  "user_id": "uuid"
}
```

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

1. **Secrets no Vault**: Credenciais nunca ficam no código
2. **Edge Functions**: Intermediário seguro entre frontend e Kiwify
3. **Rate Limiting**: Limite de requisições por usuário
4. **Validação de Assinatura**: Webhook valida signature HMAC
5. **CORS Restrito**: Apenas origens autorizadas
6. **Token Cache**: Access tokens em cache (55 min TTL)
7. **Logs Sanitizados**: Nunca loga secrets

### ⚠️ NUNCA FAZER

- ❌ Commitar credenciais no Git
- ❌ Expor client_secret no frontend
- ❌ Logar tokens ou secrets
- ❌ Usar credenciais em variáveis VITE_*
- ❌ Desabilitar validação de webhook

## 📦 Fluxo de Assinatura

### 1. Usuário Clica em "Assinar"

```
Frontend → URL Kiwify (com external_id)
```

### 2. Usuário Completa Pagamento na Kiwify

```
Kiwify → Webhook → Edge Function kiwify-webhook
```

### 3. Webhook Atualiza Banco

```typescript
// Validação HMAC
const isValid = validateWebhookSignature(body, signature);
if (!isValid) throw new Error('Invalid signature');

// Atualiza subscription
await supabase
  .from('user_subscriptions')
  .update({
    status: 'active',
    kiwify_subscription_id: data.subscription_id,
    current_period_end: data.expires_at
  })
  .eq('user_id', data.external_id);
```

### 4. Frontend Detecta Mudança (Realtime)

```typescript
// SubscriptionContext escuta mudanças
supabase
  .channel(`subscription:${userId}`)
  .on('postgres_changes', { ... }, (payload) => {
    setSubscription(payload.new);
  });
```

## 🧪 Testes

### Testar Autenticação
```bash
curl -X POST https://api.kiwify.com.br/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "SEU_CLIENT_ID",
    "client_secret": "SEU_CLIENT_SECRET"
  }'
```

### Testar Webhook Localmente
```bash
# Instalar Supabase CLI
supabase functions serve kiwify-webhook --env-file .env.local

# Enviar payload de teste
curl -X POST http://localhost:54321/functions/v1/kiwify-webhook \
  -H "Content-Type: application/json" \
  -H "X-Kiwify-Signature: test_signature" \
  -d @test-webhook-payload.json
```

## 📊 Monitoramento

### Logs da Edge Function
```bash
# Visualizar logs em tempo real
supabase functions logs kiwify-api --tail
```

### Verificar Status
```sql
-- Usuários com assinatura ativa
SELECT
  u.email,
  s.plan,
  s.status,
  s.current_period_end
FROM auth.users u
JOIN user_subscriptions s ON s.user_id = u.id
WHERE s.status = 'active';
```

## 🔗 Links Úteis

- [Kiwify API Docs](https://developers.kiwify.com.br)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets](https://supabase.com/docs/guides/functions/secrets)

---

**Última atualização:** 2025-01-30
**Versão:** 1.0.0
