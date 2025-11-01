# 🔐 Configuração da API Kiwify no Supabase

## 📋 Credenciais Recebidas

Você recebeu as seguintes credenciais da API Kiwify:

```
client_id: 4c7f47409-c212-45d1-aaf9-4a5d43dac808
client_secret: 00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac
account_id: av8qNBGVVoyVD75
```

## ⚙️ Passo 1: Configurar Secrets no Supabase

### 1.1. Acessar o Vault de Secrets

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
2. Clique em **"New secret"** para cada credencial abaixo

### 1.2. Adicionar os Secrets

Adicione os seguintes secrets **um por um**:

| Secret Name | Value |
|------------|-------|
| `KIWIFY_CLIENT_ID` | `4c7f47409-c212-45d1-aaf9-4a5d43dac808` |
| `KIWIFY_CLIENT_SECRET` | `00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac` |
| `KIWIFY_ACCOUNT_ID` | `av8qNBGVVoyVD75` |

**IMPORTANTE:**
- ✅ Copie e cole exatamente como está (sem espaços extras)
- ✅ Use os nomes EXATOS mostrados acima
- ✅ Clique em "Save" após adicionar cada um

### 1.3. Verificar Secrets Configurados

Após adicionar, você deve ver todos os 3 secrets listados:

```
✓ KIWIFY_CLIENT_ID (hidden)
✓ KIWIFY_CLIENT_SECRET (hidden)
✓ KIWIFY_ACCOUNT_ID (hidden)
```

## 🚀 Passo 2: Obter IDs dos Planos Kiwify

Para mapear corretamente os planos, precisamos dos **Product IDs** da Kiwify.

### 2.1. Acessar Painel Kiwify

1. Acesse: https://dashboard.kiwify.com.br
2. Faça login com sua conta
3. Vá em: **Produtos** → **Meus Produtos**

### 2.2. Copiar IDs dos Produtos

Para cada plano, clique em "Editar" e copie o **Product ID** da URL ou da página:

**URLs de Checkout atuais:**
- Mensal: https://pay.kiwify.com.br/uJP288j
- Trimestral: https://pay.kiwify.com.br/htkTmiC
- Anual: https://pay.kiwify.com.br/mHorNkF

**Encontre os Product IDs correspondentes** e adicione como secrets:

| Secret Name | Descrição | Exemplo de Valor |
|------------|-----------|------------------|
| `KIWIFY_PLAN_MONTHLY_ID` | ID do produto mensal | `prod_xxx...` |
| `KIWIFY_PLAN_QUARTERLY_ID` | ID do produto trimestral | `prod_yyy...` |
| `KIWIFY_PLAN_ANNUAL_ID` | ID do produto anual | `prod_zzz...` |

### 2.3. Como Encontrar o Product ID

**Método 1: Via Dashboard**
1. Dashboard Kiwify → Produtos
2. Clique em "Editar" no produto
3. O ID aparece na URL: `dashboard.kiwify.com.br/products/PRODUCT_ID/edit`

**Método 2: Via API (Recomendado)**
```bash
# Você pode usar a Edge Function para listar os produtos
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"action": "list_products"}'
```

## 🧪 Passo 3: Testar a Integração

### 3.1. Testar Autenticação OAuth

```bash
# Via Edge Function (recomendado)
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SUPABASE_TOKEN" \
  -d '{"action": "oauth_status"}'
```

**Resposta esperada:**
```json
{
  "authenticated": true,
  "expires_in": 3600,
  "account_id": "av8qNBGVVoyVD75"
}
```

### 3.2. Testar Sincronização Manual

```bash
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -d '{}'
```

## 📊 Passo 4: Verificar Sincronização

### 4.1. Consultar Assinaturas no Banco

```sql
-- Ver assinaturas sincronizadas
SELECT
  user_id,
  plan,
  status,
  kiwify_order_id,
  kiwify_subscription_id,
  current_period_end,
  updated_at
FROM user_subscriptions
WHERE plan != 'free'
ORDER BY updated_at DESC;
```

### 4.2. Consultar Pagamentos

```sql
-- Ver histórico de pagamentos
SELECT
  user_id,
  kiwify_order_id,
  amount,
  status,
  payment_method,
  paid_at
FROM payment_history
ORDER BY paid_at DESC
LIMIT 10;
```

## 🔄 Passo 5: Configurar Sincronização Automática (Opcional)

### 5.1. Criar Cron Job

```bash
# Executar sync a cada 15 minutos
supabase functions schedule create kiwify-sync-job \
  --cron "*/15 * * * *" \
  --function kiwify-sync
```

### 5.2. Verificar Jobs Agendados

```bash
supabase functions schedule list
```

## 🐛 Troubleshooting

### Erro: "Invalid client credentials"

**Causa:** Client ID ou Secret incorretos

**Solução:**
1. Verifique se copiou corretamente (sem espaços)
2. Verifique se os secrets estão com os nomes EXATOS
3. Re-adicione os secrets se necessário

### Erro: "Account not found"

**Causa:** Account ID incorreto

**Solução:**
1. Confirme o Account ID no painel Kiwify
2. Re-adicione o secret `KIWIFY_ACCOUNT_ID`

### Assinaturas não aparecem no banco

**Possíveis causas:**

1. **External ID não configurado no checkout:**
   - Certifique-se que a URL de checkout inclui `?external_id={USER_ID}`
   - Exemplo: `https://pay.kiwify.com.br/uJP288j?external_id=uuid-do-usuario`

2. **Product IDs não mapeados:**
   - Configure os secrets `KIWIFY_PLAN_*_ID`
   - Ou a função fará fallback por frequência de cobrança

3. **Webhook não configurado (se usando webhook):**
   - Configure webhook na Kiwify apontando para a Edge Function

### Como ver logs das Edge Functions

```bash
# Logs do sync
supabase functions logs kiwify-sync --follow

# Logs da API
supabase functions logs kiwify-api --follow
```

## 📝 Checklist de Configuração

- [ ] Secrets adicionados no Supabase Vault:
  - [ ] KIWIFY_CLIENT_ID
  - [ ] KIWIFY_CLIENT_SECRET
  - [ ] KIWIFY_ACCOUNT_ID
- [ ] Product IDs obtidos e configurados (opcional):
  - [ ] KIWIFY_PLAN_MONTHLY_ID
  - [ ] KIWIFY_PLAN_QUARTERLY_ID
  - [ ] KIWIFY_PLAN_ANNUAL_ID
- [ ] Migrations aplicadas:
  - [ ] 009_add_subscriptions.sql
  - [ ] 010_add_payment_history.sql
  - [ ] 011_add_kiwify_sync_state.sql
- [ ] Edge Functions deployadas:
  - [ ] kiwify-api
  - [ ] kiwify-sync
- [ ] Teste de autenticação OAuth realizado
- [ ] Primeira sincronização manual executada
- [ ] Cron job configurado (opcional)
- [ ] Checkout URLs incluem external_id

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/keawapzxqoyesptwpwav
- **Secrets Vault:** https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
- **Edge Functions:** https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
- **Kiwify Dashboard:** https://dashboard.kiwify.com.br
- **Documentação Kiwify API:** https://developers.kiwify.com.br

---

**Última atualização:** 2025-01-11
**Versão:** 1.0.0
