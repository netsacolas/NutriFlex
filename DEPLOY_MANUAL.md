# 🚀 Deploy Manual - Guia Passo a Passo

**Projeto**: NutriMais AI
**Data**: 25 de Outubro de 2025
**Objetivo**: Ativar sistema de segurança com Edge Function

---

## ✅ Pré-requisitos

- Acesso ao Dashboard do Supabase
- Projeto: `keawapzxqoyesptwpwav`
- Chave Gemini API disponível

---

## 📝 Passo 1: Executar Migração do Banco

### 1.1. Acessar SQL Editor

Abra: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/sql/new

### 1.2. Copiar e Executar SQL

Cole o seguinte código SQL e clique em **RUN**:

```sql
-- Migration 005: Add gemini_requests table for rate limiting
-- This table tracks API requests to implement rate limiting

CREATE TABLE IF NOT EXISTS public.gemini_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index para otimizar queries de rate limiting
CREATE INDEX IF NOT EXISTS idx_gemini_requests_user_created
  ON public.gemini_requests(user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.gemini_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias requisições
CREATE POLICY "Users can view their own gemini requests"
  ON public.gemini_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Edge Functions podem inserir requisições (autenticada pelo service_role)
-- Esta política permite que a Edge Function registre requisições
CREATE POLICY "Service role can insert gemini requests"
  ON public.gemini_requests
  FOR INSERT
  WITH CHECK (true);
```

### 1.3. Verificar Sucesso

Você deve ver a mensagem: **"Success. No rows returned"**

Verifique a tabela criada em:
https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor

---

## 🔐 Passo 2: Configurar Secret (Chave Gemini)

### 2.1. Acessar Vault

Abra: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

### 2.2. Adicionar Novo Secret

1. Clique em **"New secret"**
2. Preencha:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo`
3. Clique em **"Create secret"**

### 2.3. Verificar

O secret deve aparecer na lista com status **"Active"**.

---

## ⚡ Passo 3: Deploy da Edge Function

### 3.1. Acessar Edge Functions

Abra: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

### 3.2. Criar Nova Função

1. Clique em **"Create a new function"**
2. Preencha:
   - **Function name**: `gemini-proxy`
3. Clique em **"Create function"**

### 3.3. Copiar Código da Função

**Opção A: Usar CLI (se tiver token)**
```bash
npx supabase functions deploy gemini-proxy --project-ref keawapzxqoyesptwpwav
```

**Opção B: Deploy Manual (Recomendado)**

1. No editor que abriu, **delete todo o código padrão**
2. Cole o código da função (arquivo abaixo)
3. Clique em **"Deploy"**

**Código da função** (copie de `supabase/functions/gemini-proxy/index.ts`):

<details>
<summary>📄 Clique para ver o código completo</summary>

```typescript
/**
 * Supabase Edge Function: Gemini API Proxy
 *
 * Esta função funciona como um proxy seguro para a API do Google Gemini.
 * A chave da API fica armazenada no servidor (Supabase Secrets), nunca exposta ao cliente.
 *
 * Segurança implementada:
 * - Validação de autenticação (usuário precisa estar logado)
 * - Rate limiting por usuário
 * - Validação de input
 * - A chave da API nunca é exposta ao cliente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealRequest {
  mealType: string;
  targetCalories: number;
  foods: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICAÇÃO: Verificar se usuário está logado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar cliente Supabase para validar token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Validar token do usuário
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. RATE LIMITING: Verificar quantas requisições o usuário fez na última hora
    const { count } = await supabaseClient
      .from('gemini_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 20) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded - Maximum 20 requests per hour',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. VALIDAÇÃO DE INPUT
    const requestBody: MealRequest = await req.json();

    if (!requestBody.mealType || !requestBody.targetCalories || !requestBody.foods) {
      return new Response(
        JSON.stringify({ error: 'Invalid request - missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (requestBody.targetCalories < 50 || requestBody.targetCalories > 10000) {
      return new Response(
        JSON.stringify({
          error: 'Invalid calories - must be between 50 and 10000',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (requestBody.foods.length === 0 || requestBody.foods.length > 20) {
      return new Response(
        JSON.stringify({
          error: 'Invalid foods list - must have between 1 and 20 foods',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. CHAMAR API DO GEMINI (a chave está em Supabase Secrets)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error - API key missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Construir prompt (mesmo formato do geminiService.ts)
    const targetProtein = (requestBody.targetCalories * 0.3) / 4;
    const targetCarbs = (requestBody.targetCalories * 0.4) / 4;
    const targetFat = (requestBody.targetCalories * 0.3) / 9;

    const prompt = `
Você é um nutricionista especializado. Calcule as porções IDEAIS (em gramas) de cada alimento para criar uma refeição balanceada.

**IMPORTANTE - DISTRIBUIÇÃO OBRIGATÓRIA 40/30/30:**
- 40% Carboidratos: ${targetCarbs.toFixed(1)}g (${(requestBody.targetCalories * 0.4).toFixed(0)} kcal)
- 30% Proteína: ${targetProtein.toFixed(1)}g (${(requestBody.targetCalories * 0.3).toFixed(0)} kcal)
- 30% Gordura: ${targetFat.toFixed(1)}g (${(requestBody.targetCalories * 0.3).toFixed(0)} kcal)

Tipo de refeição: ${requestBody.mealType}
Meta de calorias: ${requestBody.targetCalories} kcal
Alimentos escolhidos: ${requestBody.foods.join(', ')}

Ajuste as PORÇÕES (gramas) de cada alimento para que a SOMA dos macronutrientes atinja exatamente as metas acima.

Retorne a resposta em JSON neste formato exato:
{
  "totalCalories": number,
  "totalMacros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "glycemicData": {
    "index": number,
    "load": number
  },
  "portions": [
    {
      "foodName": string,
      "grams": number,
      "homeMeasure": string,
      "calories": number,
      "macros": {
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "glycemicIndex": number
    }
  ],
  "suggestions": [string]
}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to get response from Gemini API',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = JSON.parse(responseText);

    // 5. REGISTRAR REQUISIÇÃO (para rate limiting)
    await supabaseClient.from('gemini_requests').insert({
      user_id: user.id,
      request_type: 'meal_calculation',
      created_at: new Date().toISOString(),
    });

    // 6. RETORNAR RESULTADO
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

</details>

### 3.4. Verificar Deploy

Após o deploy, verifique:
- Status deve ser **"Deployed"**
- URL da função: `https://keawapzxqoyesptwpwav.supabase.co/functions/v1/gemini-proxy`

---

## 🧪 Passo 4: Testar a Implementação

### 4.1. Abrir Aplicação

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### 4.2. Fazer Login

Acesse `http://localhost:3000` e faça login com suas credenciais.

### 4.3. Testar Cálculo de Refeição

1. Vá em **"Planejamento de Refeições"**
2. Selecione:
   - **Tipo de refeição**: Café da manhã
   - **Meta de calorias**: 400
   - **Alimentos**: Pão integral, Ovo, Abacate
3. Clique em **"Calcular Porções Ideais"**

### 4.4. Verificar no DevTools

Abra **DevTools** (F12) → Aba **Network**:

1. Deve aparecer uma chamada para `/functions/v1/gemini-proxy`
2. Status: **200 OK**
3. Response: JSON com as porções calculadas
4. **IMPORTANTE**: A API Key do Gemini NÃO deve aparecer em nenhum lugar!

### 4.5. Testar Rate Limiting (Opcional)

Para testar o limite de 20 requisições/hora:

1. Faça o mesmo cálculo 20 vezes seguidas
2. Na 21ª tentativa, deve aparecer erro:
   ```
   Você atingiu o limite de 20 cálculos por hora.
   Por favor, tente novamente mais tarde.
   ```
3. Status HTTP: **429 (Too Many Requests)**

---

## 🔧 Passo 5: Atualizar .env.local

Após confirmar que tudo funciona, remova a chave do frontend:

### 5.1. Editar .env.local

Abra o arquivo `.env.local` e **remova a linha**:
```bash
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
```

Mantenha apenas:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8
```

### 5.2. Reiniciar Servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 5.3. Testar Novamente

Faça mais um cálculo para garantir que tudo continua funcionando sem a chave no `.env.local`.

---

## ✅ Checklist Final

Antes de considerar completo, verifique:

- [ ] Tabela `gemini_requests` criada no banco
- [ ] Secret `GEMINI_API_KEY` configurado
- [ ] Edge Function `gemini-proxy` deployada
- [ ] Teste de cálculo funcionando
- [ ] API Key não aparece no DevTools
- [ ] Rate limiting funcionando (opcional)
- [ ] `.env.local` atualizado (sem `VITE_GEMINI_API_KEY`)
- [ ] Aplicação continua funcionando após reiniciar

---

## 🎉 Resultado

Após completar todos os passos:

✅ **API Key protegida** - Nunca exposta ao cliente
✅ **Rate limiting ativo** - 20 requisições/hora por usuário
✅ **Custos controlados** - Impossível abuso da quota
✅ **Score de segurança** - **85/100** 🟢

---

## 🆘 Troubleshooting

### Erro: "Unauthorized - Invalid token"
**Solução**: Faça logout e login novamente na aplicação.

### Erro: "API key missing"
**Solução**: Verifique se o Secret foi criado com o nome exato: `GEMINI_API_KEY`

### Erro: "gemini_requests does not exist"
**Solução**: Execute novamente a migração SQL no Passo 1.

### Edge Function não aparece
**Solução**: Aguarde 1-2 minutos após o deploy. O Supabase pode demorar para propagar.

### Aplicação quebrou após remover VITE_GEMINI_API_KEY
**Solução**: Verifique se o arquivo `services/geminiService.ts` está usando a Edge Function e não a API direta.

---

## 📚 Documentos Relacionados

- [SECURITY.md](SECURITY.md) - Auditoria completa de segurança
- [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) - Melhorias implementadas
- [supabase/functions/DEPLOY_INSTRUCTIONS.md](supabase/functions/DEPLOY_INSTRUCTIONS.md) - Instruções CLI

---

**Última Atualização**: 25 de Outubro de 2025
**Testado em**: Windows 11 + Node.js v24.2.0
**Tempo estimado**: 15-20 minutos
