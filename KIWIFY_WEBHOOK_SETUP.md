# 🔔 Configuração do Webhook Kiwify - Guia Completo

## ❓ Preciso criar um webhook para cada plano?

**NÃO!** Você precisa de **apenas 1 webhook** que servirá para **todos os planos** (Mensal, Trimestral e Anual).

---

## 📋 Passo a Passo: Configurar Webhook na Kiwify

### 1. Acessar Dashboard da Kiwify

1. Acesse: https://dashboard.kiwify.com.br
2. Faça login com sua conta
3. Vá em **Configurações** → **Webhooks** (ou **Integrações**)

### 2. Criar Novo Webhook

Clique em **"Novo Webhook"** ou **"Adicionar Webhook"**

### 3. Configurar URL do Webhook

**URL do Webhook:**
```
https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-webhook
```

**Eventos para Escutar:**

Selecione os seguintes eventos (marque TODOS):

- ✅ **order.approved** (Pedido aprovado/pago)
- ✅ **order.paid** (Pagamento confirmado)
- ✅ **subscription.started** (Assinatura iniciada)
- ✅ **subscription.canceled** (Assinatura cancelada)
- ✅ **subscription.updated** (Assinatura atualizada)
- ✅ **payment.approved** (Pagamento aprovado)

**❗ IMPORTANTE:** Marque TODOS os eventos relacionados a pagamento e assinatura!

### 4. Configurar Secret (Chave de Segurança)

A Kiwify vai gerar uma **chave secreta** (webhook secret) para você.

**Exemplo:**
```
whs_1234567890abcdefghijklmnopqrstuvwxyz
```

**⚠️ COPIE essa chave!** Você vai precisar dela no próximo passo.

### 5. Salvar Webhook

Clique em **"Salvar"** ou **"Criar Webhook"**

---

## 🔐 Configurar Secret no Supabase

Agora você precisa adicionar a chave secreta do webhook no Supabase:

### Opção A: Via Dashboard Supabase (RECOMENDADO)

1. Acessar: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
2. Clicar em **"New Secret"**
3. Preencher:
   - **Name:** `KIWIFY_WEBHOOK_SECRET`
   - **Value:** (colar a chave que você copiou da Kiwify)
4. Clicar em **"Create Secret"**

### Opção B: Via CLI

```bash
# Substituir SEU_SECRET_AQUI pela chave que você copiou
echo "SEU_SECRET_AQUI" | \
  supabase secrets set KIWIFY_WEBHOOK_SECRET \
  --project-ref keawapzxqoyesptwpwav \
  --stdin

# Verificar
supabase secrets list --project-ref keawapzxqoyesptwpwav
```

---

## 🚀 Deploy da Edge Function Webhook

```bash
cd ~/projetos/nutrimais

# Verificar se função existe
ls supabase/functions/kiwify-webhook/index.ts

# Deploy
supabase functions deploy kiwify-webhook --project-ref keawapzxqoyesptwpwav

# Verificar logs
supabase functions logs kiwify-webhook --tail
```

---

## 🧪 Testar o Webhook

### Teste 1: Webhook na Kiwify

1. Na dashboard da Kiwify, no webhook que você criou
2. Procure por **"Testar Webhook"** ou **"Enviar Teste"**
3. Clique para enviar um evento de teste
4. Verifique os logs no Supabase:

```bash
supabase functions logs kiwify-webhook --tail
```

### Teste 2: Fazer uma Compra Real de Teste

1. Use o cartão de teste da Kiwify (se disponível)
2. Ou faça uma compra real pequena
3. Após pagamento aprovado, verificar:

```sql
-- No Supabase SQL Editor:
SELECT * FROM user_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔍 Troubleshooting

### Problema: Webhook não está sendo chamado

**Verificar:**

1. **URL está correta?**
   ```
   https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-webhook
   ```

2. **Edge Function está deployada?**
   ```bash
   supabase functions list --project-ref keawapzxqoyesptwpwav
   # Deve listar: kiwify-webhook
   ```

3. **Eventos corretos marcados?**
   - Verifique se `order.approved` e `subscription.started` estão marcados

4. **Ver logs de erro na Kiwify:**
   - Dashboard Kiwify → Webhooks → Ver tentativas/erros

### Problema: Webhook retorna erro 401 (Invalid signature)

**Causa:** `KIWIFY_WEBHOOK_SECRET` não está configurado ou está incorreto

**Solução:**

```bash
# Verificar se secret existe
supabase secrets list --project-ref keawapzxqoyesptwpwav

# Se não existir, configurar:
supabase secrets set KIWIFY_WEBHOOK_SECRET \
  --project-ref keawapzxqoyesptwpwav

# Redeploy
supabase functions deploy kiwify-webhook --project-ref keawapzxqoyesptwpwav
```

### Problema: Webhook é chamado mas não atualiza banco

**Verificar:**

1. **Usuário existe no sistema?**
   ```sql
   SELECT id, email FROM auth.users
   WHERE email = 'email-do-cliente@exemplo.com';
   ```

2. **external_id está sendo enviado?**

   Na URL de checkout, certifique-se de incluir:
   ```
   ?external_id=UUID_DO_USUARIO&email=email@exemplo.com
   ```

3. **Ver logs detalhados:**
   ```bash
   supabase functions logs kiwify-webhook --tail
   ```

### Problema: Como saber se webhook foi recebido?

**Logs do Supabase:**

```bash
# Ver últimos 50 logs
supabase functions logs kiwify-webhook --tail

# Procurar por:
# ✅ "Assinatura atualizada com sucesso"
# ❌ "Assinatura invalida"
# ❌ "Nao foi possivel associar webhook a um usuario"
```

---

## 📊 Configuração dos Planos

Você também precisa configurar os **IDs dos planos** no Supabase:

### 1. Encontrar IDs dos Planos na Kiwify

1. Dashboard Kiwify → **Produtos**
2. Para cada produto/plano, copie o **ID** ou **Product ID**

Exemplo:
- Mensal: `prod_abc123`
- Trimestral: `prod_def456`
- Anual: `prod_ghi789`

### 2. Configurar no Supabase Vault

```bash
# ID do plano Mensal
echo "prod_abc123" | supabase secrets set KIWIFY_PLAN_MONTHLY_ID \
  --project-ref keawapzxqoyesptwpwav --stdin

# ID do plano Trimestral
echo "prod_def456" | supabase secrets set KIWIFY_PLAN_QUARTERLY_ID \
  --project-ref keawapzxqoyesptwpwav --stdin

# ID do plano Anual
echo "prod_ghi789" | supabase secrets set KIWIFY_PLAN_ANNUAL_ID \
  --project-ref keawapzxqoyesptwpwav --stdin

# Verificar
supabase secrets list --project-ref keawapzxqoyesptwpwav
```

### 3. Redeploy do Webhook

```bash
supabase functions deploy kiwify-webhook --project-ref keawapzxqoyesptwpwav
```

---

## ✅ Checklist Final

Antes de ir para produção, verifique:

- [ ] Webhook criado na Kiwify com URL correta
- [ ] Eventos corretos marcados (order.approved, subscription.started, etc)
- [ ] `KIWIFY_WEBHOOK_SECRET` configurado no Supabase Vault
- [ ] `KIWIFY_PLAN_MONTHLY_ID` configurado
- [ ] `KIWIFY_PLAN_QUARTERLY_ID` configurado
- [ ] `KIWIFY_PLAN_ANNUAL_ID` configurado
- [ ] Edge Function `kiwify-webhook` deployada
- [ ] Teste do webhook enviado pela Kiwify com sucesso
- [ ] Logs não mostram erros

---

## 🔄 Fluxo Completo

```
1. Cliente clica em "Assinar Agora"
   ↓
2. Redirecionado para Kiwify com ?external_id=USER_UUID
   ↓
3. Cliente preenche dados e paga
   ↓
4. Kiwify processa pagamento
   ↓
5. Kiwify envia POST para:
   https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-webhook
   ↓
6. Edge Function valida assinatura HMAC
   ↓
7. Edge Function atualiza tabela user_subscriptions
   ↓
8. Frontend detecta mudança via Realtime
   ↓
9. Usuário vê plano Premium ativo! ✅
```

---

## 📞 Suporte

**Logs da Edge Function:**
```bash
supabase functions logs kiwify-webhook --tail
```

**Verificar tabela de assinaturas:**
```sql
SELECT
  us.user_id,
  u.email,
  us.plan,
  us.status,
  us.current_period_end,
  us.created_at
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
ORDER BY us.created_at DESC
LIMIT 10;
```

**Documentação Kiwify:**
- https://docs.kiwify.com.br/webhooks

---

**Data:** 2025-01-30
**Versão:** 1.0
