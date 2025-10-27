# 🚨 CONFIGURAÇÃO URGENTE PARA PRODUÇÃO - NutriMais AI

## ⚠️ PROBLEMA ATUAL
O assistente nutricional **NÃO ESTÁ FUNCIONANDO** em produção (nutrimais.app) porque a **GEMINI_API_KEY não está configurada** no Supabase.

## ✅ SOLUÇÃO RÁPIDA (5 MINUTOS)

### Passo 1: Acesse o Supabase Dashboard
1. Entre em [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto NutriMais

### Passo 2: Configure a GEMINI_API_KEY no Vault

1. No menu lateral, vá para **Settings** → **Vault**
2. Clique em **"New secret"**
3. Preencha:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo`
4. Clique em **"Add secret"**

### Passo 3: Deploy da Edge Function (Se ainda não foi feito)

1. No menu lateral, vá para **Functions**
2. Verifique se a função `gemini-generic` existe
3. Se NÃO existir:
   - Clique em **"New function"**
   - Nome: `gemini-generic`
   - Cole o código do arquivo `supabase/functions/gemini-generic/index.ts`
   - Clique em **"Deploy"**

### Passo 4: Verifique as Permissões da Edge Function

1. Ainda em **Functions** → `gemini-generic`
2. Clique em **"Settings"**
3. Verifique se está marcado:
   - ✅ **Enable CORS**
   - ✅ **JWT verification** (deve estar habilitado)

### Passo 5: Teste Imediatamente

1. Acesse [nutrimais.app](https://nutrimais.app)
2. Faça login
3. Abra o assistente nutricional
4. Digite: "Olá, como posso melhorar minha alimentação?"
5. **Deve funcionar agora!**

---

## 🔍 DIAGNÓSTICO DO PROBLEMA

### Por que funciona localmente mas não em produção?

**LOCAL (Funcionando ✅)**:
```
1. Usuário envia mensagem
2. Tenta Edge Function → Falha (não tem GEMINI_API_KEY)
3. USA FALLBACK → geminiDirectService (tem VITE_GEMINI_API_KEY no .env.local)
4. Resposta OK
```

**PRODUÇÃO (Não funcionando ❌)**:
```
1. Usuário envia mensagem
2. Tenta Edge Function → Falha (não tem GEMINI_API_KEY no Vault)
3. Tenta fallback → Falha (não tem VITE_GEMINI_API_KEY em produção)
4. ERRO: "Nenhum serviço de IA disponível"
```

---

## 🛠️ ALTERNATIVA: Configurar Variável de Ambiente no Hosting

Se você estiver usando **Vercel, Netlify ou similar**, pode adicionar a variável de ambiente diretamente:

### Para Vercel:
1. Acesse o [Dashboard Vercel](https://vercel.com/dashboard)
2. Selecione o projeto
3. Vá para **Settings** → **Environment Variables**
4. Adicione:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo`
   - **Environment**: Production
5. **Redeploy** o projeto

### Para Netlify:
1. Acesse o [Dashboard Netlify](https://app.netlify.com)
2. Selecione o site
3. Vá para **Site settings** → **Environment variables**
4. Adicione:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo`
5. **Redeploy** o site

### Para GitHub Pages (não recomendado):
GitHub Pages **NÃO suporta** variáveis de ambiente. Você precisará:
- Usar outro hosting (Vercel/Netlify)
- OU configurar apenas a Edge Function do Supabase

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Após configurar, verifique:

- [ ] **No Supabase Vault**: GEMINI_API_KEY está configurada?
- [ ] **Edge Function**: gemini-generic está deployed e ativa?
- [ ] **Console do navegador**: Abra F12 e veja as mensagens:
  - ✅ "Tentando Edge Function do Supabase"
  - ✅ "Resposta recebida da Edge Function"
  - ❌ Se aparecer "Usando Gemini Direct Service como fallback" = Edge Function falhou
- [ ] **Teste real**: Faça uma pergunta ao assistente

---

## 🔐 IMPORTANTE SOBRE SEGURANÇA

### ⚠️ NÃO FAÇA ISSO:
- **NUNCA** coloque a API key direto no código
- **NUNCA** commite arquivos .env.local no Git
- **NUNCA** exponha a API key no frontend em produção

### ✅ FAÇA ISSO:
- **SEMPRE** use o Vault do Supabase para secrets
- **SEMPRE** use Edge Functions para chamadas de API
- **SEMPRE** mantenha as API keys no servidor

---

## 🚀 DEPLOY AUTOMÁTICO

Se você quiser automatizar o deploy da Edge Function:

### Usando Supabase CLI:

```bash
# 1. Instalar Supabase CLI (se ainda não tem)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Linkar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Configurar secret
supabase secrets set GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo

# 5. Deploy da função
supabase functions deploy gemini-generic

# 6. Verificar se está funcionando
supabase functions list
```

---

## 📊 MONITORAMENTO

### Como verificar se está funcionando:

1. **Logs da Edge Function** (Supabase Dashboard):
   - Functions → gemini-generic → Logs
   - Procure por erros ou sucessos

2. **Console do Browser** (F12):
   - Network → Filtrar por "gemini"
   - Ver status das requisições

3. **Teste direto via cURL**:
```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/gemini-generic \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nutrition-chat",
    "prompt": "Olá, teste",
    "systemInstruction": "Responda brevemente"
  }'
```

---

## 🆘 SUPORTE

Se ainda não funcionar após seguir todos os passos:

1. **Verifique os logs**:
   - Supabase Dashboard → Functions → Logs
   - Console do navegador (F12)

2. **Teste local com a mesma config**:
   ```bash
   # Remova temporariamente VITE_GEMINI_API_KEY do .env.local
   # Deve usar apenas Edge Function
   npm run dev
   ```

3. **Problemas comuns**:
   - **"Unauthorized"**: JWT expirado, faça logout e login
   - **"API key missing"**: GEMINI_API_KEY não está no Vault
   - **"CORS error"**: Edge Function não tem CORS habilitado
   - **"Network error"**: Verifique conexão/firewall

---

## ✅ RESULTADO ESPERADO

Após configuração correta:

1. Assistente funciona em **nutrimais.app** ✅
2. Console mostra: "Resposta recebida da Edge Function" ✅
3. Sem erros no console ✅
4. Respostas personalizadas do assistente ✅

---

## 📝 RESUMO EXECUTIVO

**AÇÃO IMEDIATA NECESSÁRIA**:

1. **Entre no Supabase** → Settings → Vault
2. **Adicione secret**: GEMINI_API_KEY = AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
3. **Verifique Edge Function**: gemini-generic está deployed
4. **Teste em nutrimais.app**

**Tempo estimado**: 5 minutos
**Impacto**: Assistente nutricional funcionando em produção

---

**IMPORTANTE**: Faça isso AGORA para o assistente funcionar em produção! 🚨