import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const clientId = Deno.env.get('KIWIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('KIWIFY_CLIENT_SECRET');
    const accountId = Deno.env.get('KIWIFY_ACCOUNT_ID');

    const result = {
      timestamp: new Date().toISOString(),
      credentials_check: {
        KIWIFY_CLIENT_ID: {
          exists: !!clientId,
          length: clientId?.length || 0,
          first_10_chars: clientId?.substring(0, 10) || 'N/A',
          has_spaces: clientId ? /\s/.test(clientId) : false,
        },
        KIWIFY_CLIENT_SECRET: {
          exists: !!clientSecret,
          length: clientSecret?.length || 0,
          first_10_chars: clientSecret?.substring(0, 10) || 'N/A',
          last_10_chars: clientSecret ? clientSecret.substring(clientSecret.length - 10) : 'N/A',
          has_spaces: clientSecret ? /\s/.test(clientSecret) : false,
        },
        KIWIFY_ACCOUNT_ID: {
          exists: !!accountId,
          length: accountId?.length || 0,
          value: accountId || 'N/A',
          has_spaces: accountId ? /\s/.test(accountId) : false,
        },
      },
      all_kiwify_env_vars: Object.keys(Deno.env.toObject())
        .filter(k => k.startsWith('KIWIFY_'))
        .sort(),
      validation: {
        all_present: !!(clientId && clientSecret && accountId),
        will_pass_kiwify_client_check: !!(clientId && clientSecret && accountId),
      }
    };

    return new Response(
      JSON.stringify(result, null, 2),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }, null, 2),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
