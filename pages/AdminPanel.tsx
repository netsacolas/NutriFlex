import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, AdminUser } from '../services/adminService'

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [selectedPlan, setSelectedPlan] = useState<string>('free')
  const [durationDays, setDurationDays] = useState<number>(30)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const isAdminUser = await adminService.checkIsAdmin()
      setIsAdmin(isAdminUser)

      if (!isAdminUser) {
        navigate('/app')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      navigate('/app')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSelectedUser(null)
    setLoading(true)

    try {
      const results = await adminService.searchUsers(searchEmail)
      setUsers(results)

      if (results.length === 0) {
        setError('Nenhum usuário encontrado com esse e-mail')
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user)
    setSelectedPlan(user.current_plan || 'free')
    setDurationDays(adminService.getPlanDuration(user.current_plan || 'free'))
    setError(null)
    setSuccess(null)
  }

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await adminService.updateSubscription({
        user_id: selectedUser.user_id,
        plan: selectedPlan as any,
        duration_days: durationDays
      })

      setSuccess(`Assinatura atualizada com sucesso para ${adminService.getPlanDisplayName(selectedPlan)}`)

      // Refresh user list
      const results = await adminService.searchUsers(searchEmail)
      setUsers(results)

      // Update selected user
      const updatedUser = results.find(u => u.user_id === selectedUser.user_id)
      if (updatedUser) {
        setSelectedUser(updatedUser)
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan)
    setDurationDays(adminService.getPlanDuration(plan))
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Verificando permissões...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-white text-2xl font-bold">
            🛡️ Painel Administrativo
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔍 Buscar Usuário</h2>

          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Digite o e-mail do usuário..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}

        {/* User List */}
        {users.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Usuários Encontrados</h2>

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedUser?.user_id === user.user_id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{user.email}</p>
                      <p className="text-sm text-gray-600">{user.full_name || 'Nome não informado'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user.current_plan.includes('premium')
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {adminService.getPlanDisplayName(user.current_plan)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {adminService.getStatusDisplayName(user.subscription_status)}
                      </p>
                    </div>
                  </div>

                  {user.subscription_end && (
                    <p className="text-xs text-gray-500 mt-2">
                      Expira em: {new Date(user.subscription_end).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Subscription Section */}
        {selectedUser && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">✏️ Editar Assinatura</h2>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Usuário selecionado</p>
                <p className="font-semibold text-gray-800">{selectedUser.email}</p>
                <p className="text-sm text-gray-600">{selectedUser.full_name || 'Nome não informado'}</p>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="free">Gratuito</option>
                  <option value="premium_monthly">Premium Mensal (30 dias)</option>
                  <option value="premium_quarterly">Premium Trimestral (90 dias)</option>
                  <option value="premium_annual">Premium Anual (365 dias)</option>
                </select>
              </div>

              {/* Duration */}
              {selectedPlan !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (dias)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                    min="1"
                    max="3650"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data de expiração: {new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta ação irá atualizar o plano, status, data de início e expiração na tabela
                  <code className="mx-1 px-1 bg-yellow-100 rounded">user_subscriptions</code>
                  e criar um registro no histórico de pagamentos, simulando uma ativação via Kiwify.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleUpdateSubscription}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Atualizando...' : 'Atualizar Assinatura'}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
