import { supabase } from './supabaseClient'
import logger from '../utils/logger'

export type AdminPlan = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual'
export type AdminStatus = 'active' | 'incomplete' | 'past_due' | 'cancelled'
export type AdminSortField = 'name' | 'email' | 'plan' | 'status' | 'expiration' | 'days_remaining' | 'updated_at'

export interface AdminUserRow {
  userId: string
  email: string
  fullName: string | null
  plan: AdminPlan
  planLabel: string
  status: AdminStatus | string
  statusLabel: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  daysRemaining: number
  lastPaymentStatus: string | null
  lastPaymentAt: string | null
  lastPaymentAmount: number | null
  updatedAt: string | null
  userCreatedAt: string
  riskBucket: string
}

export interface AdminUserFilters {
  search?: string
  plans?: AdminPlan[]
  status?: string[]
  dueInDays?: number | null
  startRange?: { from?: string | null; to?: string | null }
  endRange?: { from?: string | null; to?: string | null }
}

export interface AdminListParams {
  filters?: AdminUserFilters
  sort?: { field: AdminSortField; direction: 'asc' | 'desc' }
  pagination?: { page: number; pageSize: number }
}

export interface AdminListResponse {
  users: AdminUserRow[]
  total: number
  page: number
  pageSize: number
}

export interface AdminMetrics {
  totalUsers: number
  planCounts: Record<string, number>
  riskCounts: Record<string, number>
}

export interface AdminSegment {
  id: string
  name: string
  description: string | null
  filters: AdminUserFilters
  createdAt: string
}

export interface AdminHistoryEntry {
  id: string
  actionType: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  notes: string | null
  createdAt: string
  adminEmail: string | null
}

export interface AdminSubscriptionChange {
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

export interface AdminBulkActionRequest {
  userIds: string[]
  change: AdminSubscriptionChange
}

interface CallOptions {
  expectBlob?: boolean
}

const DEFAULT_PAGE_SIZE = 25

const PLAN_LABELS: Record<AdminPlan, string> = {
  free: 'Plano Gratuito',
  premium_monthly: 'Premium Mensal',
  premium_quarterly: 'Premium Trimestral',
  premium_annual: 'Premium Anual'
}

const PLAN_DURATIONS: Record<AdminPlan, number> = {
  free: 0,
  premium_monthly: 30,
  premium_quarterly: 90,
  premium_annual: 365
}

class AdminService {
  private async callAdminFunction<T>(action: string, params: Record<string, unknown> = {}, options: CallOptions = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
        },
        body: JSON.stringify({ action, ...params })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData?.error ?? `Erro ao executar ${action}`
      throw new Error(message)
    }

    if (options.expectBlob) {
      return (await response.blob()) as unknown as T
    }

    return response.json() as Promise<T>
  }

  private transformUserRow(row: any): AdminUserRow {
    return {
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name,
      plan: row.plan,
      planLabel: row.plan_label ?? PLAN_LABELS[row.plan as AdminPlan] ?? row.plan,
      status: row.status,
      statusLabel: row.status_label ?? row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      daysRemaining: Number(row.days_remaining ?? 0),
      lastPaymentStatus: row.last_payment_status ?? null,
      lastPaymentAt: row.last_payment_at ?? null,
      lastPaymentAmount: row.last_payment_amount ?? null,
      updatedAt: row.updated_at ?? null,
      userCreatedAt: row.user_created_at,
      riskBucket: row.risk_bucket ?? 'ok'
    }
  }

  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return false
      }

      if (user.email) {
        const { data: isAdminResult, error: rpcError } = await supabase.rpc('is_admin', {
          user_email: user.email
        })

        if (!rpcError && typeof isAdminResult === 'boolean') {
          return isAdminResult
        }

        if (rpcError) {
          logger.warn('Falha ao verificar is_admin RPC', rpcError)
        }
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        logger.error('Erro consultando admin_users', error)
        return false
      }

      return !!data
    } catch (error) {
      logger.error('Erro ao verificar admin', error)
      return false
    }
  }

  async listUsers(params: AdminListParams = {}): Promise<AdminListResponse> {
    const { filters = {}, sort = { field: 'name', direction: 'asc' }, pagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE } } = params

    const payload = {
      filters,
      sort,
      pagination
    }

    const result = await this.callAdminFunction<{ users: any[]; total?: number }>('list_users', payload)
    const rows = result?.users ?? []
    const total = Number(result?.total ?? (rows[0]?.total_count ?? 0))
    const users = rows.map(this.transformUserRow.bind(this))

    return {
      users,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
  }

  async getMetrics(): Promise<AdminMetrics> {
    const [planData, riskData] = await Promise.all([
      this.callAdminFunction<{ plans: Array<{ metric: string; total: number }> }> ('get_metrics', { type: 'plan' }),
      this.callAdminFunction<{ risk: Array<{ risk_bucket: string; total: number }> }> ('get_metrics', { type: 'risk' })
    ])

    const planCounts: Record<string, number> = {}
    planData?.plans?.forEach((item) => {
      planCounts[item.metric] = Number(item.total ?? 0)
    })

    const riskCounts: Record<string, number> = {}
    riskData?.risk?.forEach((item) => {
      riskCounts[item.risk_bucket] = Number(item.total ?? 0)
    })

    const totalUsers = Object.values(planCounts).reduce((acc, value) => acc + value, 0)

    return { totalUsers, planCounts, riskCounts }
  }

  async listSegments(): Promise<AdminSegment[]> {
    const response = await this.callAdminFunction<{ segments: any[] }>('list_segments')
    return (response?.segments ?? []).map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description ?? null,
      filters: segment.filters ?? {},
      createdAt: segment.created_at
    }))
  }

  async saveSegment(name: string, description: string | null, filters: AdminUserFilters): Promise<AdminSegment> {
    const response = await this.callAdminFunction<{ segment: any }>('save_segment', {
      name,
      description,
      filters
    })

    const segment = response.segment ?? {}
    return {
      id: segment.id,
      name: segment.name,
      description: segment.description ?? null,
      filters: segment.filters ?? {},
      createdAt: segment.created_at
    }
  }

  async deleteSegment(segmentId: string): Promise<boolean> {
    const response = await this.callAdminFunction<{ deleted: boolean }>('delete_segment', { segment_id: segmentId })
    return Boolean(response?.deleted)
  }

  async getUserHistory(userId: string): Promise<AdminHistoryEntry[]> {
    const response = await this.callAdminFunction<{ history: any[] }>('get_user_history', { user_id: userId })
    return (response?.history ?? []).map((entry) => ({
      id: entry.id,
      actionType: entry.action_type,
      beforeState: entry.before_state ?? null,
      afterState: entry.after_state ?? null,
      notes: entry.notes ?? null,
      createdAt: entry.created_at,
      adminEmail: entry.admin_email ?? null
    }))
  }

  async updateSubscription(change: AdminSubscriptionChange & { userId: string }): Promise<void> {
    await this.callAdminFunction('update_subscription', {
      user_id: change.userId,
      change
    })
  }

  async bulkUpdateSubscriptions(request: AdminBulkActionRequest): Promise<{ success: string[]; failed: Array<{ userId: string; error: string }> }> {
    const response = await this.callAdminFunction<{ success: string[]; failed: Array<{ userId: string; error: string }> }>('bulk_update', request)
    return {
      success: response?.success ?? [],
      failed: response?.failed ?? []
    }
  }

  async exportUsers(params: AdminListParams = {}): Promise<{ filename: string; csv: string }> {
    const response = await this.callAdminFunction<{ filename: string; csv: string }>('export_users', params)
    return {
      filename: response?.filename ?? `nutrimais-usuarios-${new Date().toISOString()}.csv`,
      csv: response?.csv ?? ''
    }
  }

  async getUsersByIds(ids: string[]): Promise<AdminUserRow[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      return []
    }
    const response = await this.callAdminFunction<{ users: any[] }>('get_users_by_ids', { ids })
    return (response?.users ?? []).map(this.transformUserRow.bind(this))
  }

  getPlanDuration(plan: AdminPlan): number {
    return PLAN_DURATIONS[plan] ?? 0
  }

  getPlanDisplayName(plan: AdminPlan): string {
    return PLAN_LABELS[plan] ?? plan
  }
}

export const adminService = new AdminService()
