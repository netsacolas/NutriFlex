# 🔍 Como Ver os Logs de Erro

## PASSO 1: Verificar Logs da Edge Function

1. Acesse: **https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/admin-operations/logs**

2. Configure para "Last hour" (última hora)

3. Procure por erros **500** ou **ERROR**

4. **Copie a mensagem exata do erro** e me envie

---

## PASSO 2: Verificar Console do Navegador

1. Com a página `/admin` aberta, pressione **F12**

2. Vá na aba **"Console"**

3. Procure por erros em **vermelho**

4. **Copie TODOS os erros** (clique com botão direito > Copy > Copy all messages)

5. Me envie

---

## PASSO 3: Verificar Network (Rede)

1. Com F12 aberto, vá na aba **"Network"** (Rede)

2. Recarregue a página (F5)

3. Procure por requisições com status **500** ou **401**

4. Clique na requisição com erro

5. Vá na aba **"Response"**

6. **Copie a resposta completa** e me envie

---

## PASSO 4: Testar Diretamente a Edge Function

Abra o navegador em modo anônimo e teste:

**URL:** https://keawapzxqoyesptwpwav.functions.supabase.co/admin-operations

**Resultado esperado:**
- Status 400 ou 401 = função está funcionando
- Status 500 = erro na função
- Timeout = função não deployada

Me envie o status e a mensagem que aparecer.

---

## 🆘 O Que Preciso

Para diagnosticar o problema, me envie:

1. ✅ Screenshot ou texto dos **logs da Edge Function** (Supabase Dashboard)
2. ✅ Screenshot ou texto dos **erros do Console** (F12)
3. ✅ Screenshot ou texto da **resposta da requisição com erro** (Network tab)

Com essas informações vou identificar exatamente qual é o erro!
