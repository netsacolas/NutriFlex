# =€ Deploy da Edge Function - Gemini Proxy

Este documento contém instruções completas para fazer deploy da Edge Function que funciona como proxy seguro para a API do Gemini.

---

## Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase

   # Verificar instalação
   supabase --version
   ```

2. **Conta no Supabase**
   - Ter acesso ao projeto: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav

3. **Chave da API do Gemini**
   - Criar nova chave em: https://aistudio.google.com/app/apikey
   - **IMPORTANTE:** Revogar a chave antiga que foi exposta

---

## Passo 1: Executar Migração do Banco de Dados

A Edge Function precisa de uma tabela para fazer rate limiting.

1. Acesse o SQL Editor do Supabase:
   https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/sql

2. Execute o conteúdo do arquivo:
   `migrations/005_add_gemini_requests_table.sql`

3. Verifique que a tabela foi criada:
   ```sql
   SELECT * FROM public.gemini_requests LIMIT 1;
   ```

---

## Passo 2: Configurar Secrets no Supabase

A chave da API do Gemini deve ficar guardada como um "secret" no Supabase, nunca no código.

### Via Dashboard (Mais fácil)

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
   - **Code**: Copie todo o conteúdo de `supabase/functions/gemini-proxy/index.ts`
4. Clique em **"Deploy function"**
5. Copie a URL da função (será algo como: `https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy`)

### Via CLI (Recomendado para atualizações futuras)

```bash
# 1. Login (se ainda não fez)
supabase login

# 2. Link ao projeto (se ainda não fez)
supabase link --project-ref keawapzxqoyesptpwpwav

# 3. Deploy da função
supabase functions deploy gemini-proxy

# 4. A URL será mostrada no terminal
# Exemplo: https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy
```

---

## Passo 4: Atualizar o Frontend

Agora que a Edge Function está no ar, precisamos atualizar o código do frontend para usá-la em vez de chamar o Gemini diretamente.

### O que fazer:

1. **Criar novo serviço**: `services/geminiProxyService.ts`
2. **Atualizar**: `services/geminiService.ts` para usar o proxy
3. **Remover**: `VITE_GEMINI_API_KEY` do `.env.local` (não é mais necessário no frontend)

**NOTA:** Vou criar esses arquivos nos próximos passos após confirmar que a Edge Function está funcionando.

---

## Passo 5: Testar a Edge Function

### Teste Manual via cURL

```bash
# 1. Fazer login e obter token
# (Você precisará do token de um usuário autenticado)

# 2. Testar a função
curl -X POST \
  'https://keawapzxqoyesptpwpwav.supabase.co/functions/v1/gemini-proxy' \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "mealType": "lunch",
    "targetCalories": 600,
    "foods": ["arroz integral", "frango grelhado", "brócolis"]
  }'
```

### Teste via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptpwpwav/functions
2. Clique na função `gemini-proxy`
3. Clique em **"Invoke function"**
4. Cole o JSON de teste:
   ```json
   {
     "mealType": "lunch",
     "targetCalories": 600,
     "foods": ["arroz integral", "frango grelhado", "brócolis"]
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

## Resolução de Problemas

### Erro: "API key missing"

**Causa:** O secret `GEMINI_API_KEY` não foi configurado ou não está acessível pela função.

**Solução:**
```bash
# Verificar secrets existentes
supabase secrets list

# Se não aparecer, adicionar novamente
supabase secrets set GEMINI_API_KEY=sua_chave_aqui

# Fazer redeploy
supabase functions deploy gemini-proxy
```

### Erro: "Unauthorized"

**Causa:** Token de autenticação inválido ou ausente.

**Solução:**
- Verificar que o header `Authorization: Bearer TOKEN` está sendo enviado
- Verificar que o usuário está autenticado no frontend
- Testar com um token novo (fazer login novamente)

### Erro: "Rate limit exceeded"

**Causa:** Usuário fez mais de 20 requisições na última hora.

**Solução:**
- É um comportamento esperado (segurança)
- Esperar 1 hora ou ajustar o limite no código da função (linha 82)
- Para desenvolvimento, pode aumentar temporariamente para 100

### Erro: "CORS"

**Causa:** Configuração de CORS incorreta.

**Solução:**
- Verificar que as linhas 18-21 do código têm os headers corretos
- Verificar que a função retorna `corsHeaders` em TODAS as respostas

---

## Segurança Implementada

 **Autenticação**: Só usuários logados podem chamar
 **Rate Limiting**: Máximo 20 requisições/hora por usuário
 **Validação de Input**: Calorias entre 50-10000, 1-20 alimentos
 **API Key no servidor**: Nunca exposta ao cliente
 **CORS configurado**: Aceita requisições do frontend
 **RLS ativado**: Usuários só veem suas próprias requisições

---

## Custos Estimados

### Edge Functions (Supabase)
- **Free Tier**: 500,000 invocations/mês
- **Pro Plan**: 2,000,000 invocations/mês inclusos
- **Custo adicional**: $2 por 1M invocations

### Gemini API (Google)
- **Free Tier**: 1,500 requests/dia
- **Acima disso**: Varia por modelo
- **gemini-2.0-flash-exp**: Geralmente gratuito em preview

Com 100 usuários ativos fazendo 20 cálculos/mês cada:
- **Total**: 2,000 requests/mês
- **Custo Edge Functions**: $0 (dentro do free tier)
- **Custo Gemini API**: $0 (dentro do free tier)

---

## Próximos Passos

Após confirmar que a Edge Function está funcionando:

1.  Criar `services/geminiProxyService.ts`
2.  Atualizar frontend para usar o proxy
3.  Remover `VITE_GEMINI_API_KEY` do `.env.local` e `.env.example`
4.  Testar fluxo completo no frontend
5.  Monitorar logs por alguns dias

---

## Comandos Úteis

```bash
# Ver status do link com o projeto
supabase status

# Listar funções deployed
supabase functions list

# Fazer redeploy após alterações
supabase functions deploy gemini-proxy

# Ver logs em tempo real
supabase functions logs gemini-proxy --follow

# Deletar função (cuidado!)
supabase functions delete gemini-proxy
```

---

**Dúvidas?**
- Docs Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Docs Gemini API: https://ai.google.dev/docs

---

**Criado em**: 2025-10-25
**Última atualização**: 2025-10-25
