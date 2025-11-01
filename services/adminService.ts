import { supabase } from './supabaseClient'

export interface AdminUser {
  user_id: string
  email: string
  full_name: string
  current_plan: string
  subscription_status: string
  subscription_start: string | null
  subscription_end: string | null
  kiwify_subscription_id: string | null
}

export interface UserDetails {
  profile: any
  subscription: any
  payments: any[]
}

export interface UpdateSubscriptionParams {
  user_id: string
  plan: 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual'
  duration_days?: number
}

class AdminService {
  private async callAdminFunction(action: string, params: any = {}) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Não autenticado')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao executar operação administrativa')
    }

    return response.json()
  }

  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return false

      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single()

      return !!data
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  async searchUsers(email: string): Promise<AdminUser[]> {
    try {
      const result = await this.callAdminFunction('search_users', { email })
      return result.users || []
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  async getUserDetails(userId: string): Promise<UserDetails> {
    try {
      const result = await this.callAdminFunction('get_user_details', { user_id: userId })
      return result
    } catch (error) {
      console.error('Error getting user details:', error)
      throw error
    }
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<any> {
    try {
      const result = await this.callAdminFunction('update_subscription', params)
      return result.subscription
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  // Helper to get plan duration in days
  getPlanDuration(plan: string): number {
    switch (plan) {
      case 'premium_monthly':
        return 30
      case 'premium_quarterly':
        return 90
      case 'premium_annual':
        return 365
      default:
        return 0
    }
  }

  // Helper to get plan display name
  getPlanDisplayName(plan: string): string {
    switch (plan) {
      case 'free':
        return 'Gratuito'
      case 'premium_monthly':
        return 'Premium Mensal'
      case 'premium_quarterly':
        return 'Premium Trimestral'
      case 'premium_annual':
        return 'Premium Anual'
      default:
        return plan
    }
  }

  // Helper to format subscription status
  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'inactive':
        return 'Inativo'
      case 'cancelled':
        return 'Cancelado'
      case 'past_due':
        return 'Vencido'
      case 'incomplete':
        return 'Incompleto'
      default:
        return status
    }
  }
}

export const adminService = new AdminService()
