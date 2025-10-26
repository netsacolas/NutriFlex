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
    // Log de todos os headers recebidos (DEBUG)
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value.substring(0, 50); // Limitar tamanho
    });
    console.log('[DEBUG] All headers:', JSON.stringify(allHeaders));

    // 1. AUTENTICAÇÃO: Criar cliente Supabase a partir da requisição
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('apikey');

    console.log('[DEBUG] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'MISSING');
    console.log('[DEBUG] ApiKey header:', apiKeyHeader ? 'Present' : 'MISSING');

    // Extrair o token JWT do header Authorization
    const jwt = authHeader?.replace('Bearer ', '');

    if (!jwt) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'No JWT token provided',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar cliente Supabase para validar o token
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // IMPORTANTE: Passar o JWT explicitamente para getUser()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    console.log('[DEBUG] User:', user ? user.id : 'Not found');
    console.log('[DEBUG] Error:', userError?.message || 'None');

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in to use this function',
          details: userError?.message
        }),
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

    // 5. REGISTRAR REQUISIÇÃO (para rate limiting e custos)
    await supabaseClient.from('gemini_requests').insert({
      user_id: user.id,
      user_email: user.email,
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
