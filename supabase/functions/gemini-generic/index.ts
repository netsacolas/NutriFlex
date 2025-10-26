/**
 * Supabase Edge Function: Gemini Generic Proxy
 *
 * Proxy genérico para chamadas ao Gemini API
 * Suporta: weight analysis, nutrition chat, e outras funcionalidades futuras
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenericRequest {
  type: 'weight-analysis' | 'nutrition-chat' | 'quick-analysis';
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICAÇÃO
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '');

    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No JWT token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. VALIDAÇÃO DE INPUT
    const requestBody: GenericRequest = await req.json();

    if (!requestBody.type || !requestBody.prompt) {
      return new Response(
        JSON.stringify({ error: 'Invalid request - missing type or prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. CHAMAR API DO GEMINI
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error - API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir payload para Gemini
    const geminiPayload: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: requestBody.prompt }]
        }
      ],
      generationConfig: {
        temperature: requestBody.temperature || 0.8,
        topP: requestBody.topP || 0.9,
        maxOutputTokens: requestBody.maxOutputTokens || 1000,
      },
    };

    // Adicionar system instruction se fornecido
    if (requestBody.systemInstruction) {
      geminiPayload.systemInstruction = {
        parts: [{ text: requestBody.systemInstruction }]
      };
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.log('[ERROR] Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. REGISTRAR REQUISIÇÃO (para rastreamento de custos)
    await supabaseClient.from('gemini_requests').insert({
      user_id: user.id,
      user_email: user.email,
      request_type: requestBody.type,
      created_at: new Date().toISOString(),
    });

    // 5. RETORNAR RESULTADO
    return new Response(
      JSON.stringify({ response: responseText }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.log('[ERROR] Internal error:', error);
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
