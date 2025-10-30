# 🚀 Guia Completo: Configurar Kiwify para Liberação Automática Premium

## ✅ Status Atual

- [x] Histórico funcionando em produção
- [x] Link trimestral atualizado para: https://pay.kiwify.com.br/Omg0hAs
- [x] Código de integração Kiwify implementado
- [x] Edge Function kiwify-webhook criada
- [ ] Tabela user_subscriptions criada no banco
- [ ] Webhook configurado na Kiwify
- [ ] Secrets configurados no Supabase
- [ ] Edge Function deployada
- [ ] Fluxo de pagamento testado

---

## 📋 PASSO 1: Criar Tabela de Assinaturas no Banco

A tabela `user_subscriptions` é essencial para armazenar o status das assinaturas.

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor

2. Clique em **"SQL Editor"** (ícone de console no menu lateral)

3. Clique em **"New Query"**

4. Copie e cole o conteúdo do arquivo:
   ```
   c:\NutriMais\supabase\migrations\009_add_subscriptions.sql
   ```

5. Clique em **"Run"** (ou pressione `Ctrl + Enter`)

6. Você deve ver a mensagem: **"Success. No rows returned"**

### Opção B: Via Supabase CLI

```bash
# No diretório do projeto
cd c:\NutriMais

# Execute a migração
supabase db push --project-ref keawapzxqoyesptwpwav
```

### Verificar se deu certo:

1. Vá em **Table Editor** no Supabase Dashboard
2. Procure pela tabela **`user_subscriptions`**
3. Deve aparecer com as colunas: id, user_id, plan, status, etc.

---

## 📋 PASSO 2: Obter IDs dos Planos na Kiwify

Você precisa dos **Product IDs** (ou Plan IDs) de cada plano na Kiwify.

### Como encontrar os IDs:

**Opção 1 - Via Dashboard Kiwify:**

1. Acesse: https://dashboard.kiwify.com.br/products
2. Clique em cada produto (Mensal, Trimestral, Anual)
3. Na URL você verá algo como: `.../products/12345`
4. O número **12345** é o Product ID

**Opção 2 - Via API Kiwify:**

1. Use o endpoint: `GET https://api.kiwify.com.br/v1/products`
2. Procure pelos produtos "NutriMais" na resposta
3. Anote o campo `"id"` de cada produto

### IDs que você precisa:

```
Plan Mensal (R$ 19,90):
Link: https://pay.kiwify.com.br/uJP288j
Product ID: __________________ (preencher)

Plan Trimestral (R$ 49,90):
Link: https://pay.kiwify.com.br/Omg0hAs
Product ID: __________________ (preencher)

Plan Anual (R$ 179,90):
Link: https://pay.kiwify.com.br/mHorNkF
Product ID: __________________ (preencher)
```

---

## 📋 PASSO 3: Configurar Webhook na Kiwify

O webhook permite que a Kiwify notifique seu sistema quando um pagamento é aprovado.

### 3.1. Acesse o Dashboard da Kiwify

1. Entre em: https://dashboard.kiwify.com.br
2. Vá em **Configurações** → **Webhooks** (ou **Integrações**)

### 3.2. Criar Novo Webhook

1. Clique em **"Novo Webhook"** ou **"Adicionar Webhook"**

2. Preencha os campos:

   **URL do Webhook:**
   ```
   https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-webhook
   ```

   **Eventos a marcar** (marque TODOS):
   - [x] `order.approved` ou `order.paid`
   - [x] `subscription.started`
   - [x] `subscription.updated`
   - [x] `subscription.canceled`
   - [x] `subscription.expired`

3. Clique em **"Salvar"** ou **"Criar Webhook"**

### 3.3. Copiar o Webhook Secret

Após criar o webhook, a Kiwify vai gerar um **Token Secreto** (Webhook Secret).

**COPIE ESTE TOKEN** - você vai precisar dele no próximo passo!

Exemplo: `wh_secret_abc123xyz789`

---

## 📋 PASSO 4: Configurar Secrets no Supabase

Agora você precisa configurar as credenciais no Supabase Secrets Vault.

### 4.1. Acesse o Secrets Vault

1. Entre em: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. Você verá a lista de secrets

### 4.2. Adicionar os Secrets da Kiwify

Clique em **"New Secret"** para cada item abaixo:

#### Secret 1: KIWIFY_CLIENT_ID
```
Name: KIWIFY_CLIENT_ID
Value: 190fbd3d-baa1-47b0-aa42-686e4feb8932
```

#### Secret 2: KIWIFY_CLIENT_SECRET
```
Name: KIWIFY_CLIENT_SECRET
Value: 78b45eccd73c25be808b83389ba51fff815f3ee62af5695bc37cdf9c754e311f
```

#### Secret 3: KIWIFY_ACCOUNT_ID
```
Name: KIWIFY_ACCOUNT_ID
Value: av8qNBGVVoyVD75
```

#### Secret 4: KIWIFY_WEBHOOK_SECRET
```
Name: KIWIFY_WEBHOOK_SECRET
Value: [COLE O TOKEN QUE A KIWIFY GEROU NO PASSO 3.3]
```

#### Secret 5: KIWIFY_PLAN_MONTHLY_ID
```
Name: KIWIFY_PLAN_MONTHLY_ID
Value: [COLE O PRODUCT ID DO PLANO MENSAL DO PASSO 2]
```

#### Secret 6: KIWIFY_PLAN_QUARTERLY_ID
```
Name: KIWIFY_PLAN_QUARTERLY_ID
Value: [COLE O PRODUCT ID DO PLANO TRIMESTRAL DO PASSO 2]
```

#### Secret 7: KIWIFY_PLAN_ANNUAL_ID
```
Name: KIWIFY_PLAN_ANNUAL_ID
Value: [COLE O PRODUCT ID DO PLANO ANUAL DO PASSO 2]
```

### 4.3. Verificar se todos foram criados

Na lista de secrets, você deve ver:
- ✅ KIWIFY_CLIENT_ID
- ✅ KIWIFY_CLIENT_SECRET
- ✅ KIWIFY_ACCOUNT_ID
- ✅ KIWIFY_WEBHOOK_SECRET
- ✅ KIWIFY_PLAN_MONTHLY_ID
- ✅ KIWIFY_PLAN_QUARTERLY_ID
- ✅ KIWIFY_PLAN_ANNUAL_ID

---

## 📋 PASSO 5: Deploy da Edge Function kiwify-webhook

A Edge Function processa os webhooks da Kiwify e atualiza as assinaturas.

### 5.1. Instalar Supabase CLI (se ainda não tiver)

```bash
# Windows
winget install Supabase.CLI

# Ou via npm
npm install -g supabase
```

### 5.2. Fazer Login no Supabase CLI

```bash
supabase login
```

Isso vai abrir o navegador para você autorizar.

### 5.3. Fazer Deploy da Edge Function

```bash
cd c:\NutriMais

# Deploy da função kiwify-webhook
supabase functions deploy kiwify-webhook --project-ref keawapzxqoyesptwpwav
```

Você deve ver:
```
✓ Deployed Function kiwify-webhook on project keawapzxqoyesptwpwav
```

### 5.4. Verificar se a função foi deployada

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Você deve ver a função **kiwify-webhook** na lista

---

## 📋 PASSO 6: Testar o Fluxo Completo

Agora vamos testar se tudo está funcionando!

### 6.1. Teste 1: Verificar Webhook na Kiwify

1. No dashboard da Kiwify, vá em **Webhooks**
2. Procure o webhook que você criou
3. Deve mostrar status: **Ativo** ou **Active**
4. Pode ter uma opção **"Testar Webhook"** - se tiver, clique!

### 6.2. Teste 2: Fazer um Pagamento de Teste

**IMPORTANTE**: Use o modo de teste da Kiwify ou faça uma compra real de baixo valor.

1. Acesse um dos links de checkout:
   - Mensal: https://pay.kiwify.com.br/uJP288j
   - Trimestral: https://pay.kiwify.com.br/Omg0hAs
   - Anual: https://pay.kiwify.com.br/mHorNkF

2. Preencha com um **email de teste**

3. Complete o pagamento

4. **IMPORTANTE**: Use o MESMO email que você usa para login no NutriMais!

### 6.3. Verificar se o Premium foi liberado

Após o pagamento ser aprovado (pode levar 1-2 minutos):

1. Faça login no NutriMais: https://www.nutrimais.app

2. Vá para a página de **Assinatura**: `/assinatura`

3. Você deve ver:
   - ✅ Badge "Assinante Premium"
   - ✅ Status: "Ativo"
   - ✅ Seu plano atual (Mensal/Trimestral/Anual)

4. Teste as funcionalidades Premium:
   - Criar mais de 2 refeições por dia
   - Ver histórico completo (sem limite de 5 registros)
   - Acessar o chat de IA em `/chat`

### 6.4. Verificar no Banco de Dados

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor

2. Execute a query:
   ```sql
   SELECT * FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'seu-email-de-teste@example.com');
   ```

3. Você deve ver:
   - `plan`: 'premium_monthly' (ou quarterly/annual)
   - `status`: 'active'
   - `kiwify_order_id`: preenchido
   - `current_period_end`: data futura

---

## 🔍 Troubleshooting

### Problema 1: Webhook não dispara

**Sintomas**: Pagamento aprovado mas Premium não liberado

**Verificar**:

1. Logs da Edge Function:
   ```bash
   supabase functions logs kiwify-webhook --project-ref keawapzxqoyesptwpwav
   ```

2. Dashboard Kiwify → Webhooks → Ver tentativas de envio

3. Verificar se a URL do webhook está correta

**Solução**: Recrie o webhook com a URL correta

---

### Problema 2: Erro 401 ou 403 no webhook

**Sintomas**: Logs mostram erro de autenticação

**Causa**: KIWIFY_WEBHOOK_SECRET incorreto

**Solução**:
1. Vá no dashboard da Kiwify
2. Copie novamente o Webhook Secret
3. Atualize no Supabase Secrets Vault
4. Faça redeploy da função:
   ```bash
   supabase functions deploy kiwify-webhook --project-ref keawapzxqoyesptwpwav
   ```

---

### Problema 3: Plano não reconhecido

**Sintomas**: Premium não liberado, logs mostram "Plan ID not recognized"

**Causa**: IDs dos planos incorretos nos secrets

**Solução**:
1. Verifique os Product IDs na Kiwify (Passo 2)
2. Atualize os secrets no Supabase:
   - KIWIFY_PLAN_MONTHLY_ID
   - KIWIFY_PLAN_QUARTERLY_ID
   - KIWIFY_PLAN_ANNUAL_ID
3. Faça redeploy da função

---

### Problema 4: Email não corresponde

**Sintomas**: Pagamento aprovado mas usuário não encontrado

**Causa**: Email usado no checkout é diferente do email cadastrado no NutriMais

**Solução**:
- Use o MESMO email em ambos os sistemas
- Ou implemente busca por CPF/phone (requer customização)

---

## 📊 Monitoramento

### Ver logs em tempo real:

```bash
supabase functions logs kiwify-webhook --project-ref keawapzxqoyesptwpwav --tail
```

### Ver histórico de webhooks na Kiwify:

1. Dashboard Kiwify → Webhooks
2. Clique no webhook
3. Ver tentativas de envio e respostas

---

## ✅ Checklist Final

Antes de considerar a integração completa:

- [ ] Tabela `user_subscriptions` criada no Supabase
- [ ] Webhook criado e ativo na Kiwify
- [ ] Webhook Secret copiado
- [ ] 7 secrets configurados no Supabase Vault
- [ ] Edge Function `kiwify-webhook` deployada
- [ ] Teste de pagamento realizado
- [ ] Premium liberado corretamente no sistema
- [ ] Usuário consegue acessar funcionalidades Premium
- [ ] Logs da Edge Function sem erros

---

## 🎉 Conclusão

Após completar todos os passos, o fluxo completo será:

1. Usuário clica em "Assinar" no site
2. É redirecionado para checkout Kiwify
3. Completa o pagamento
4. Kiwify envia webhook para seu servidor
5. Edge Function processa o webhook
6. Tabela `user_subscriptions` é atualizada
7. Usuário automaticamente ganha acesso Premium
8. Limites são removidos (refeições ilimitadas, histórico completo, chat IA)

---

**Tempo estimado**: 20-30 minutos
**Dificuldade**: Intermediária

Se tiver dúvidas em qualquer passo, me avise que eu te ajudo! 🚀
