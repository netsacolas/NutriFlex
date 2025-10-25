import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const envVars = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Present' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing',
    GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY') ? 'Present' : 'Missing',
  };

  return new Response(JSON.stringify(envVars, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
