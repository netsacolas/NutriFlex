import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

type SortDirection = 'asc' | 'desc'
type AdminPlan = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual'

interface ListUsersParams {
  filters?: Record<string, unknown>
  sort?: { field?: string; direction?: SortDirection }
  pagination?: { page?: number; pageSize?: number }
}

interface SubscriptionChange {
  plan?: AdminPlan
  startDate?: string | null
  endDate?: string | null
  addDays?: number
  removeDays?: number
  setDaysRemaining?: number
  notes?: string
  actionLabel?: string
  summary?: string
}

const PLAN_DURATIONS: Record<AdminPlan, number> = {
  free: 0,
  premium_monthly: 30,
  premium_quarterly: 90,
  premium_annual: 365
}

const DEFAULT_PAGE_SIZE = 25
const MAX_EXPORT_SIZE = 5000

function getPlanDuration(plan: AdminPlan | undefined): number {
  if (!plan) return 0
  return PLAN_DURATIONS[plan] ?? 0
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date
}

function iso(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString()
}

async function ensureAdminUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error('Forbidden: Admin access required')
  }

  return data
}

async function fetchSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  if (data) {
    return data
  }

  const nowIso = new Date().toISOString()
  const { data: inserted, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan: 'free',
      status: 'active',
      current_period_start: nowIso,
      current_period_end: null,
      last_event_at: nowIso
    })
    .select('*')
    .single()

  if (insertError) throw insertError
  return inserted
}

async function recordAudit(
  supabase: ReturnType<typeof createClient>,
  adminUser: { id: string; email: string | null },
  targetUserId: string,
  actionType: string,
  beforeState: Record<string, unknown>,
  afterState: Record<string, unknown>,
  notes?: string | null
) {
  const { error } = await supabase.rpc('admin_record_subscription_audit', {
    p_admin_user: adminUser.id,
    p_admin_email: adminUser.email,
    p_target_user: targetUserId,
    p_action_type: actionType,
    p_before: beforeState,
    p_after: afterState,
    p_notes: notes ?? null
  })

  if (error) throw error
}

function normaliseSort(sort: { field?: string; direction?: SortDirection } | undefined) {
  const allowedFields = new Set(['name', 'email', 'plan', 'status', 'expiration', 'days_remaining', 'updated_at'])
  const field = sort?.field && allowedFields.has(sort.field) ? sort.field : 'name'
  const direction = sort?.direction === 'desc' ? 'desc' : 'asc'
  return { field, direction }
}

function normalisePagination(pagination: { page?: number; pageSize?: number } | undefined) {
  const page = Math.max(1, Math.floor(pagination?.page ?? 1))
  const pageSize = Math.max(5, Math.min(100, Math.floor(pagination?.pageSize ?? DEFAULT_PAGE_SIZE)))
  return { page, pageSize }
}

async function handleListUsers(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email: string | null },
  params: ListUsersParams
) {
  const filters = params.filters ?? {}
  const sort = normaliseSort(params.sort)
  const pagination = normalisePagination(params.pagination)

  const { data, error } = await supabase.rpc('admin_list_users', {
    p_admin_user: user.id,
    p_search: filters.search ?? null,
    p_plans: filters.plans ?? null,
    p_status: filters.status ?? null,
    p_due_in_days: filters.dueInDays ?? null,
    p_start_from: filters.startRange?.from ?? null,
    p_start_to: filters.startRange?.to ?? null,
    p_end_from: filters.endRange?.from ?? null,
    p_end_to: filters.endRange?.to ?? null,
    p_sort_field: sort.field,
    p_sort_direction: sort.direction,
    p_page: pagination.page,
    p_page_size: pagination.pageSize
  })

  if (error) throw error

  const total = data?.[0]?.total_count ?? 0
  return { users: data ?? [], total }
}

async function handleMetrics(
  supabase: ReturnType<typeof createClient>,
  user: { id: string },
  type: 'plan' | 'risk' | 'all'
) {
  if (type === 'plan' || type === 'all') {
    const { data: plans, error } = await supabase.rpc('admin_get_plan_metrics', { p_admin_user: user.id })
    if (error) throw error
    if (type === 'plan') {
      return { plans }
    }
    const response: Record<string, unknown> = { plans }
    const { data: risk, error: riskError } = await supabase.rpc('admin_get_risk_metrics', { p_admin_user: user.id })
    if (riskError) throw riskError
    response.risk = risk
    return response
  }

  const { data: risk, error } = await supabase.rpc('admin_get_risk_metrics', { p_admin_user: user.id })
  if (error) throw error
  return { risk }
}

function applyDayAdjustments(
  baseEnd: Date | null,
  startDate: Date,
  plan: AdminPlan,
  change: SubscriptionChange
): Date | null {
  let computedEnd = baseEnd

  if (change.setDaysRemaining !== undefined && change.setDaysRemaining !== null) {
    computedEnd = new Date()
    computedEnd.setHours(0, 0, 0, 0)
    computedEnd.setDate(computedEnd.getDate() + change.setDaysRemaining)
  }

  const delta = (change.addDays ?? 0) - (change.removeDays ?? 0)
  if (delta !== 0) {
    if (!computedEnd) {
      computedEnd = new Date(startDate)
      computedEnd.setDate(computedEnd.getDate() + getPlanDuration(plan))
    }
    computedEnd.setDate(computedEnd.getDate() + delta)
  }

  return computedEnd
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createClient>,
  adminUser: { id: string; email: string | null },
  targetUserId: string,
  change: SubscriptionChange
) {
  if (!targetUserId) {
    throw new Error('user_id é obrigatório')
  }

  const beforeState = await fetchSubscription(supabase, targetUserId)
  const now = new Date()

  const currentPlan = (beforeState.plan ?? 'free') as AdminPlan
  const plan = (change.plan ?? currentPlan) as AdminPlan

  let startDate = parseDate(change.startDate) ?? parseDate(beforeState.current_period_start) ?? now
  let endDate: Date | null = null

  if (plan === 'free') {
    startDate = now
    endDate = null
  } else {
    if (change.endDate !== undefined) {
      endDate = parseDate(change.endDate)
    } else if (beforeState.current_period_end) {
      endDate = parseDate(beforeState.current_period_end)
    } else {
      endDate = new Date(startDate)
      const planDuration = getPlanDuration(plan) || 30
      endDate.setDate(endDate.getDate() + planDuration)
    }

    endDate = applyDayAdjustments(endDate, startDate, plan, change)
  }

  if (endDate && endDate < startDate) {
    throw new Error('A data de expiração não pode ser anterior à data de início.')
  }

  const updates: Record<string, unknown> = {
    plan,
    current_period_start: iso(startDate),
    current_period_end: iso(endDate),
    status: plan === 'free' ? 'active' : 'active',
    last_event_at: now.toISOString()
  }

  if (plan === 'free') {
    updates.current_period_end = null
  }

  const { data: updated, error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('user_id', targetUserId)
    .select('*')
    .single()

  if (error) throw error

  await recordAudit(
    supabase,
    adminUser,
    targetUserId,
    change.actionLabel ?? change.summary ?? 'subscription_update',
    beforeState,
    updated,
    change.notes ?? null
  )

  return updated
}

function sanitiseCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes('"') || stringValue.includes(';') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function buildCsv(rows: any[]): string {
  const headers = [
    'Nome',
    'Email',
    'Plano',
    'Status',
    'Data de início',
    'Data de expiração',
    'Dias restantes',
    'Status pagamento',
    'Último pagamento',
    'Atualizado em'
  ]

  const csvRows = rows.map((row) => [
    sanitiseCsvValue(row.full_name ?? ''),
    sanitiseCsvValue(row.email),
    sanitiseCsvValue(row.plan_label ?? row.plan),
    sanitiseCsvValue(row.status_label ?? row.status),
    sanitiseCsvValue(row.current_period_start ?? ''),
    sanitiseCsvValue(row.current_period_end ?? ''),
    sanitiseCsvValue(row.days_remaining ?? 0),
    sanitiseCsvValue(row.last_payment_status ?? ''),
    sanitiseCsvValue(row.last_payment_at ?? ''),
    sanitiseCsvValue(row.updated_at ?? '')
  ].join(';'))

  return [headers.join(';'), ...csvRows].join('\n')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { action, ...params } = payload

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl =
      Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL')
    const serviceKey =
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase credentials not configured for admin-operations')
    }
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminRecord = await ensureAdminUser(supabase, user.id)
    const adminUser = { id: user.id, email: user.email ?? adminRecord.email }

    let result: Record<string, unknown> | undefined

    switch (action) {
      case 'list_users': {
        const data = await handleListUsers(supabase, adminUser, params as ListUsersParams)
        result = data
        break
      }

      case 'get_metrics': {
        const type = (params.type as 'plan' | 'risk' | 'all') ?? 'all'
        const data = await handleMetrics(supabase, adminUser, type)
        result = data
        break
      }

      case 'list_segments': {
        const { data, error } = await supabase.rpc('admin_list_segments', { p_admin_user: adminUser.id })
        if (error) throw error
        result = { segments: data ?? [] }
        break
      }

      case 'save_segment': {
        const { name, description, filters } = params
        const { data, error } = await supabase.rpc('admin_save_segment', {
          p_admin_user: adminUser.id,
          p_name: name,
          p_description: description ?? null,
          p_filters: filters ?? {}
        })
        if (error) throw error
        result = { segment: data?.[0] ?? null }
        break
      }

      case 'delete_segment': {
        const { segment_id } = params
        const { data, error } = await supabase.rpc('admin_delete_segment', {
          p_admin_user: adminUser.id,
          p_segment_id: segment_id
        })
        if (error) throw error
        result = { deleted: data ?? false }
        break
      }

      case 'get_user_history': {
        const { user_id } = params
        const { data, error } = await supabase.rpc('admin_get_user_history', {
          p_admin_user: adminUser.id,
          p_target_user: user_id,
          p_limit: params.limit ?? 100
        })
        if (error) throw error
        result = { history: data ?? [] }
        break
      }

      case 'get_users_by_ids': {
        const { ids } = params as { ids: string[] }
        if (!Array.isArray(ids) || ids.length === 0) {
          throw new Error('Informe uma lista de usuários para buscar.')
        }
        const { data, error } = await supabase
          .from('admin_user_snapshot')
          .select('*')
          .in('user_id', ids)

        if (error) throw error
        result = { users: data ?? [] }
        break
      }

      case 'update_subscription': {
        const { user_id, change } = params as { user_id: string; change: SubscriptionChange }
        await handleSubscriptionUpdate(supabase, adminUser, user_id, change ?? {})
        result = { success: true }
        break
      }

      case 'bulk_update': {
        const { userIds, change } = params as { userIds: string[]; change: SubscriptionChange }
        if (!Array.isArray(userIds) || userIds.length === 0) {
          throw new Error('Informe ao menos um usuário para aplicar a ação em massa.')
        }

        const successes: string[] = []
        const failed: Array<{ userId: string; error: string }> = []

        for (const userId of userIds) {
          try {
            await handleSubscriptionUpdate(supabase, adminUser, userId, change ?? {})
            successes.push(userId)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            failed.push({ userId, error: message })
          }
        }

        result = { success: successes, failed }
        break
      }

      case 'export_users': {
        const filters = params.filters ?? {}
        const sort = params.sort ?? {}
        const listResponse = await handleListUsers(supabase, adminUser, {
          filters,
          sort,
          pagination: { page: 1, pageSize: MAX_EXPORT_SIZE }
        })
        const csv = buildCsv(listResponse.users ?? [])
        const filename = `nutrimais-usuarios-${new Date().toISOString().split('T')[0]}.csv`
        result = { filename, csv, total: listResponse.total ?? listResponse.users.length }
        break
      }

      case 'search_users': {
        const { data, error } = await supabase.rpc('admin_search_users', { search_email: params.email ?? '' })
        if (error) throw error
        result = { users: data ?? [] }
        break
      }

      case 'get_user_details': {
        const { user_id } = params
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user_id)
          .maybeSingle()

        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle()

        const { data: payments } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', user_id)
          .order('paid_at', { ascending: false })
          .limit(20)

        result = { profile, subscription, payments }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result ?? { ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Admin operation error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
