# 🔍 Diagnóstico: Problema de Reconhecimento de Compras Kiwify

## Problema Identificado

O sistema não está reconhecendo as compras realizadas na Kiwify porque **faltam os IDs dos planos** configurados nas variáveis de ambiente.

### Variáveis Faltantes no `.env.local`:
```env
KIWIFY_PLAN_MONTHLY_ID=     # ❌ VAZIO
KIWIFY_PLAN_QUARTERLY_ID=   # ❌ VAZIO
KIWIFY_PLAN_ANNUAL_ID=      # ❌ VAZIO
```

## Como o Mapeamento Funciona

O arquivo `supabase/functions/_shared/kiwify.ts:32-68` faz o mapeamento assim:

1. **Primeiro**: Tenta mapear pelo ID exato do plano (mais confiável)
   ```typescript
   if (planId && monthly && planId === monthly) return 'premium_monthly';
   if (planId && quarterly && planId === quarterly) return 'premium_quarterly';
   if (planId && annual && planId === annual) return 'premium_annual';
   ```

2. **Fallback**: Se não achar, tenta pela frequência (menos confiável)
   ```typescript
   if (normalized.includes('month')) return 'premium_monthly';
   if (normalized.includes('quarter')) return 'premium_quarterly';
   if (normalized.includes('year') || normalized.includes('annual')) return 'premium_annual';
   ```

## ✅ Solução em 3 Passos

### Passo 1: Descobrir os IDs dos Planos

Execute o script de teste para listar assinaturas e descobrir os IDs:

```bash
# Criar arquivo de teste
cat > scripts/test-kiwify-discover-plans.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Descobrir IDs dos Planos Kiwify</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
    button { padding: 10px 20px; margin: 10px 5px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background: #45a049; }
    .result { background: #f4f4f4; padding: 15px; margin: 10px 0; border-radius: 5px; overflow-x: auto; }
    pre { margin: 0; white-space: pre-wrap; }
    .error { background: #ffebee; border-left: 4px solid #f44336; }
    .success { background: #e8f5e9; border-left: 4px solid #4CAF50; }
  </style>
</head>
<body>
  <h1>🔍 Descobrir IDs dos Planos Kiwify</h1>

  <p><strong>Objetivo:</strong> Encontrar os IDs únicos dos 3 planos (Mensal, Trimestral, Anual)</p>

  <div>
    <label>Email do usuário com compra ativa:</label><br>
    <input type="email" id="userEmail" placeholder="usuario@exemplo.com" style="width: 300px; padding: 8px; margin: 10px 0;">
  </div>

  <button onclick="discoverPlans()">Descobrir Planos</button>
  <button onclick="clearResults()">Limpar</button>

  <div id="output"></div>

  <script>
    const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

    async function discoverPlans() {
      const email = document.getElementById('userEmail').value.trim();

      if (!email) {
        showResult('⚠️ Digite um email válido', 'error');
        return;
      }

      showResult('🔄 Buscando assinaturas na Kiwify...', 'result');

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            action: 'list_subscriptions',
            email: email
          })
        });

        const result = await response.json();

        if (!response.ok) {
          showResult(`❌ Erro: ${result.error || 'Falha na requisição'}`, 'error');
          showResult(`Detalhes: ${JSON.stringify(result, null, 2)}`, 'error');
          return;
        }

        if (!result.data || result.data.length === 0) {
          showResult('⚠️ Nenhuma assinatura encontrada para este email', 'error');
          showResult('Verifique se o email está correto e se há compras ativas', 'error');
          return;
        }

        showResult(`✅ Encontradas ${result.data.length} assinatura(s)`, 'success');

        const planIds = new Map();

        result.data.forEach((subscription, index) => {
          const planId = subscription.plan_id || subscription.product_id || subscription.plan?.id || 'DESCONHECIDO';
          const frequency = subscription.frequency || subscription.billing_period || subscription.plan?.frequency || 'DESCONHECIDO';
          const status = subscription.status || subscription.subscription_status || 'DESCONHECIDO';

          showResult(`
📋 Assinatura ${index + 1}:
   ID da Assinatura: ${subscription.id}
   Plano ID: ${planId}
   Frequência: ${frequency}
   Status: ${status}
   Email: ${subscription.customer?.email || subscription.customer_email || 'N/A'}
          `, 'result');

          if (frequency.toLowerCase().includes('month')) {
            planIds.set('MENSAL', planId);
          } else if (frequency.toLowerCase().includes('quarter')) {
            planIds.set('TRIMESTRAL', planId);
          } else if (frequency.toLowerCase().includes('year') || frequency.toLowerCase().includes('annual')) {
            planIds.set('ANUAL', planId);
          }
        });

        if (planIds.size > 0) {
          let envVars = '\n\n✅ COPIE ESTAS VARIÁVEIS PARA SEU .env.local:\n\n';
          if (planIds.has('MENSAL')) envVars += `KIWIFY_PLAN_MONTHLY_ID=${planIds.get('MENSAL')}\n`;
          if (planIds.has('TRIMESTRAL')) envVars += `KIWIFY_PLAN_QUARTERLY_ID=${planIds.get('TRIMESTRAL')}\n`;
          if (planIds.has('ANUAL')) envVars += `KIWIFY_PLAN_ANNUAL_ID=${planIds.get('ANUAL')}\n`;

          showResult(envVars, 'success');
        }

        showResult(`\n📄 Resposta completa da API:\n${JSON.stringify(result, null, 2)}`, 'result');

      } catch (error) {
        showResult(`❌ Erro: ${error.message}`, 'error');
        console.error(error);
      }
    }

    function showResult(message, type = 'result') {
      const output = document.getElementById('output');
      const div = document.createElement('div');
      div.className = `result ${type}`;
      div.innerHTML = `<pre>${message}</pre>`;
      output.appendChild(div);
      div.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
      document.getElementById('output').innerHTML = '';
    }
  </script>
</body>
</html>
EOF
```

Depois abra: **`scripts/test-kiwify-discover-plans.html`** no navegador

### Passo 2: Atualizar `.env.local`

Depois de descobrir os IDs, atualize o arquivo `.env.local`:

```env
# Kiwify Plan IDs (para mapeamento correto)
KIWIFY_PLAN_MONTHLY_ID=SEU_ID_MENSAL_AQUI
KIWIFY_PLAN_QUARTERLY_ID=SEU_ID_TRIMESTRAL_AQUI
KIWIFY_PLAN_ANNUAL_ID=SEU_ID_ANUAL_AQUI
```

### Passo 3: Configurar Secrets no Supabase

⚠️ **IMPORTANTE**: Estes IDs também precisam estar nos **Secrets** das Edge Functions!

Execute os comandos:

```bash
# Configurar secrets no Supabase
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="SEU_ID_MENSAL_AQUI"
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID="SEU_ID_TRIMESTRAL_AQUI"
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID="SEU_ID_ANUAL_AQUI"

# Verificar secrets configurados
npx supabase secrets list
```

Ou configure manualmente no dashboard:
👉 https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

## 🧪 Testar a Sincronização

Após configurar os IDs, teste a sincronização manual:

```bash
# Opção 1: Via Bash (requer autenticação)
npx supabase functions invoke kiwify-api --body '{
  "action": "sync_manual",
  "emails": ["email-do-usuario-com-compra@exemplo.com"]
}'

# Opção 2: Via Script HTML (mais fácil)
# Abra: scripts/test-kiwify-sync.html
```

### Criar script de teste de sincronização:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Testar Sincronização Kiwify</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
    button { padding: 10px 20px; margin: 10px 5px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background: #0b7dda; }
    .result { background: #f4f4f4; padding: 15px; margin: 10px 0; border-radius: 5px; overflow-x: auto; }
    pre { margin: 0; white-space: pre-wrap; }
    .error { background: #ffebee; border-left: 4px solid #f44336; }
    .success { background: #e8f5e9; border-left: 4px solid #4CAF50; }
  </style>
</head>
<body>
  <h1>🔄 Testar Sincronização Kiwify</h1>

  <div>
    <label>Email do usuário:</label><br>
    <input type="email" id="userEmail" placeholder="usuario@exemplo.com" style="width: 300px; padding: 8px; margin: 10px 0;">
  </div>

  <button onclick="syncManual()">Sincronizar Manualmente</button>
  <button onclick="clearResults()">Limpar</button>

  <div id="output"></div>

  <script>
    const SUPABASE_URL = 'https://keawapzxqoyesptwpwav.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8';

    async function syncManual() {
      const email = document.getElementById('userEmail').value.trim();

      if (!email) {
        showResult('⚠️ Digite um email válido', 'error');
        return;
      }

      showResult('🔄 Iniciando sincronização manual...', 'result');

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/kiwify-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            action: 'sync_manual',
            emails: [email],
            include_payments: true
          })
        });

        const result = await response.json();

        if (!response.ok) {
          showResult(`❌ Erro: ${result.error || 'Falha na sincronização'}`, 'error');
          showResult(`Detalhes: ${JSON.stringify(result, null, 2)}`, 'error');
          return;
        }

        showResult(`✅ Sincronização concluída!`, 'success');
        showResult(`
📊 Resultados:
   Assinaturas sincronizadas: ${result.result?.subscriptionsPersisted || 0}
   Pagamentos inseridos: ${result.result?.paymentsInserted || 0}
   Usuários encontrados: ${result.result?.usersMatched || 0}
   Erros: ${result.result?.errors || 0}
        `, 'success');

        showResult(`\n📄 Resposta completa:\n${JSON.stringify(result, null, 2)}`, 'result');

      } catch (error) {
        showResult(`❌ Erro: ${error.message}`, 'error');
        console.error(error);
      }
    }

    function showResult(message, type = 'result') {
      const output = document.getElementById('output');
      const div = document.createElement('div');
      div.className = `result ${type}`;
      div.innerHTML = `<pre>${message}</pre>`;
      output.appendChild(div);
      div.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
      document.getElementById('output').innerHTML = '';
    }
  </script>
</body>
</html>
```

## 📝 Verificar no Banco de Dados

Após sincronizar, verifique se os dados foram persistidos:

```sql
-- Ver assinaturas sincronizadas
SELECT
  u.email,
  s.plan,
  s.status,
  s.current_period_end,
  s.kiwify_plan_id,
  s.kiwify_subscription_id,
  s.last_event_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'email-do-usuario@exemplo.com';

-- Ver histórico de pagamentos
SELECT
  u.email,
  p.plan,
  p.amount_cents / 100.0 AS amount_brl,
  p.payment_status,
  p.paid_at,
  p.kiwify_order_id
FROM payment_history p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'email-do-usuario@exemplo.com'
ORDER BY p.paid_at DESC;
```

## 🎯 Checklist de Resolução

- [ ] Descobrir IDs dos planos usando `test-kiwify-discover-plans.html`
- [ ] Atualizar `.env.local` com os IDs descobertos
- [ ] Configurar secrets no Supabase (via CLI ou Dashboard)
- [ ] Reiniciar servidor de desenvolvimento (`npm run dev`)
- [ ] Testar sincronização manual com `test-kiwify-sync.html`
- [ ] Verificar dados no banco com as queries SQL acima
- [ ] Confirmar que usuário tem plano correto no frontend

## ❓ Troubleshooting

### "Nenhuma assinatura encontrada"
- Verifique se o email está correto
- Confirme se há compras ativas na Kiwify
- Verifique se as credenciais OAuth estão corretas

### "Usuário não encontrado"
- O usuário precisa estar cadastrado no sistema primeiro
- Certifique-se que o email na Kiwify é o mesmo do cadastro

### "Plano permanece 'free'"
- Os IDs dos planos provavelmente não foram configurados
- Verifique os secrets do Supabase
- Refaça deploy das Edge Functions

### "Status 'incomplete' ou 'cancelled'"
- Verifique o status real da assinatura na Kiwify
- Status mapeados: approved/paid/completed/active → active
- Status com 'cancel' → cancelled
- Status com 'past_due'/'overdue' → past_due
