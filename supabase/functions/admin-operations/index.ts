import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify user session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    let result

    switch (action) {
      case 'search_users':
        const { data: users, error: searchError } = await supabase
          .rpc('admin_search_users', { search_email: params.email || '' })

        if (searchError) throw searchError
        result = { users }
        break

      case 'update_subscription':
        const { data: updatedSub, error: updateError } = await supabase
          .rpc('admin_update_subscription', {
            target_user_id: params.user_id,
            new_plan: params.plan,
            duration_days: params.duration_days || 30
          })

        if (updateError) throw updateError
        result = { subscription: updatedSub }
        break

      case 'get_user_details':
        // Get complete user information
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.user_id)
          .single()

        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', params.user_id)
          .single()

        const { data: payments } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', params.user_id)
          .order('paid_at', { ascending: false })
          .limit(10)

        result = { profile, subscription, payments }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
