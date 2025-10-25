# =� Deploy da Edge Function - Gemini Proxy

Este documento cont�m instru��es completas para fazer deploy da Edge Function que funciona como proxy seguro para a API do Gemini.

---

## Pr�-requisitos

1. **Supabase CLI instalado**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase

   # Verificar instala��o
   supabase --version
   ```

2. **Conta no Supabase**
   - Ter acesso ao projeto: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav

3. **Chave da API do Gemini**
   - Criar nova chave em: https://aistudio.google.com/app/apikey
   - **IMPORTANTE:** Revogar a chave antiga que foi exposta

---

## Passo 1: Executar Migra��o do Banco de Dados

A Edge Function precisa de uma tabela para fazer rate limiting.

1. Acesse o SQL Editor do Supabase:
   https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/sql

2. Execute o conte�do do arquivo:
   `migrations/005_add_gemini_requests_table.sql`

3. Verifique que a tabela foi criada:
   ```sql
   SELECT * FROM public.gemini_requests LIMIT 1;
   ```

---

## Passo 2: Configurar Secrets no Supabase

A chave da API do Gemini deve ficar guardada como um "secret" no Supabase, nunca no c�digo.

### Via Dashboard (Mais f�cil)

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
   - **Code**: Copie todo o conte�do de `supabase/functions/gemini-proxy/index.ts`
4. Clique em **"Deploy function"**
5. Copie a URL da fun��o (ser� algo como: `https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy`)

### Via CLI (Recomendado para atualiza��es futuras)

```bash
# 1. Login (se ainda n�o fez)
supabase login

# 2. Link ao projeto (se ainda n�o fez)
supabase link --project-ref keawapzxqoyesptpwpwav

# 3. Deploy da fun��o
supabase functions deploy gemini-proxy

# 4. A URL ser� mostrada no terminal
# Exemplo: https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy
```

---

## Passo 4: Atualizar o Frontend

Agora que a Edge Function est� no ar, precisamos atualizar o c�digo do frontend para us�-la em vez de chamar o Gemini diretamente.

### O que fazer:

1. **Criar novo servi�o**: `services/geminiProxyService.ts`
2. **Atualizar**: `services/geminiService.ts` para usar o proxy
3. **Remover**: `VITE_GEMINI_API_KEY` do `.env.local` (n�o � mais necess�rio no frontend)

**NOTA:** Vou criar esses arquivos nos pr�ximos passos ap�s confirmar que a Edge Function est� funcionando.

---

## Passo 5: Testar a Edge Function

### Teste Manual via cURL

```bash
# 1. Fazer login e obter token
# (Voc� precisar� do token de um usu�rio autenticado)

# 2. Testar a fun��o
curl -X POST \
  'https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy' \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "mealType": "lunch",
    "targetCalories": 600,
    "foods": ["arroz integral", "frango grelhado", "br�colis"]
  }'
```

### Teste via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/functions
2. Clique na fun��o `gemini-proxy`
3. Clique em **"Invoke function"**
4. Cole o JSON de teste:
   ```json
   {
     "mealType": "lunch",
     "targetCalories": 600,
     "foods": ["arroz integral", "frango grelhado", "br�colis"]
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

## Resolu��o de Problemas

### Erro: "API key missing"

**Causa:** O secret `GEMINI_API_KEY` n�o foi configurado ou n�o est� acess�vel pela fun��o.

**Solu��o:**
```bash
# Verificar secrets existentes
supabase secrets list

# Se n�o aparecer, adicionar novamente
supabase secrets set GEMINI_API_KEY=sua_chave_aqui

# Fazer redeploy
supabase functions deploy gemini-proxy
```

### Erro: "Unauthorized"

**Causa:** Token de autentica��o inv�lido ou ausente.

**Solu��o:**
- Verificar que o header `Authorization: Bearer TOKEN` est� sendo enviado
- Verificar que o usu�rio est� autenticado no frontend
- Testar com um token novo (fazer login novamente)

### Erro: "Rate limit exceeded"

**Causa:** Usu�rio fez mais de 20 requisi��es na �ltima hora.

**Solu��o:**
- � um comportamento esperado (seguran�a)
- Esperar 1 hora ou ajustar o limite no c�digo da fun��o (linha 82)
- Para desenvolvimento, pode aumentar temporariamente para 100

### Erro: "CORS"

**Causa:** Configura��o de CORS incorreta.

**Solu��o:**
- Verificar que as linhas 18-21 do c�digo t�m os headers corretos
- Verificar que a fun��o retorna `corsHeaders` em TODAS as respostas

---

## Seguran�a Implementada

 **Autentica��o**: S� usu�rios logados podem chamar
 **Rate Limiting**: M�ximo 20 requisi��es/hora por usu�rio
 **Valida��o de Input**: Calorias entre 50-10000, 1-20 alimentos
 **API Key no servidor**: Nunca exposta ao cliente
 **CORS configurado**: Aceita requisi��es do frontend
 **RLS ativado**: Usu�rios s� veem suas pr�prias requisi��es

---

## Custos Estimados

### Edge Functions (Supabase)
- **Free Tier**: 500,000 invocations/m�s
- **Pro Plan**: 2,000,000 invocations/m�s inclusos
- **Custo adicional**: $2 por 1M invocations

### Gemini API (Google)
- **Free Tier**: 1,500 requests/dia
- **Acima disso**: Varia por modelo
- **gemini-2.0-flash-exp**: Geralmente gratuito em preview

Com 100 usu�rios ativos fazendo 20 c�lculos/m�s cada:
- **Total**: 2,000 requests/m�s
- **Custo Edge Functions**: $0 (dentro do free tier)
- **Custo Gemini API**: $0 (dentro do free tier)

---

## Pr�ximos Passos

Ap�s confirmar que a Edge Function est� funcionando:

1.  Criar `services/geminiProxyService.ts`
2.  Atualizar frontend para usar o proxy
3.  Remover `VITE_GEMINI_API_KEY` do `.env.local` e `.env.example`
4.  Testar fluxo completo no frontend
5.  Monitorar logs por alguns dias

---

## Comandos �teis

```bash
# Ver status do link com o projeto
supabase status

# Listar fun��es deployed
supabase functions list

# Fazer redeploy ap�s altera��es
supabase functions deploy gemini-proxy

# Ver logs em tempo real
supabase functions logs gemini-proxy --follow

# Deletar fun��o (cuidado!)
supabase functions delete gemini-proxy
```

---

**D�vidas?**
- Docs Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Docs Gemini API: https://ai.google.dev/docs

---

**Criado em**: 2025-10-25
**�ltima atualiza��o**: 2025-10-25
