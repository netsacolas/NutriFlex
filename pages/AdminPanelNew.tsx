import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminService,
  AdminMetrics,
  AdminUserFilters,
  AdminUserRow
} from '../services/adminService'
import { EditUserModal } from '../components/Admin/EditUserModal'
import { UserTable } from '../components/Admin/UserTable'

const DEFAULT_FILTERS: AdminUserFilters = {
  search: '',
  plans: [],
  status: [],
  dueInDays: null
}

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
  const [sort, setSort] = useState({ field: 'name' as const, direction: 'asc' as const })
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Verificar acesso admin
  useEffect(() => {
    loadAccess()
  }, [])

  // Carregar dados
  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, filters, sort, pagination.page, pagination.pageSize])

  const loadAccess = useCallback(async () => {
    try {
      const hasAccess = await adminService.checkIsAdmin()
      setIsAdmin(hasAccess)
      if (!hasAccess) {
        navigate('/home')
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error)
      navigate('/home')
    }
  }, [navigate])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, metricsData] = await Promise.all([
        adminService.listUsers({
          filters,
          sort,
          pagination: { page: pagination.page, pageSize: pagination.pageSize }
        }),
        adminService.getMetrics()
      ])

      setUsers(usersData.users)
      setPagination((prev) => ({ ...prev, total: usersData.total }))
      setMetrics(metricsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados do painel admin')
    } finally {
      setLoading(false)
    }
  }, [filters, sort, pagination.page, pagination.pageSize])

  const handleSaveUser = async (
    userId: string,
    changes: {
      plan?: 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual'
      endDate?: string | null
      addDays?: number
      notes?: string
    }
  ) => {
    try {
      await adminService.updateSubscription({ userId, ...changes })
      await loadData() // Recarregar dados
      setSelectedUser(null)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field: field as any,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleQuickFilter = (dueInDays: number | null) => {
    setFilters((prev) => ({ ...prev, dueInDays }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
              <p className="text-sm text-slate-600 mt-1">
                Gerencie usuários, planos e assinaturas
              </p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total de Usuários</p>
                <p className="text-4xl font-bold mt-2">{metrics?.totalUsers || 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Premium Mensal</p>
                <p className="text-4xl font-bold mt-2">
                  {metrics?.planCounts?.premium_monthly || 0}
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Premium Trimestral</p>
                <p className="text-4xl font-bold mt-2">
                  {metrics?.planCounts?.premium_quarterly || 0}
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Premium Anual</p>
                <p className="text-4xl font-bold mt-2">
                  {metrics?.planCounts?.premium_annual || 0}
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros Rápidos */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filtros Rápidos */}
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickFilter(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filters.dueInDays === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleQuickFilter(7)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filters.dueInDays === 7
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Expira em 7 dias
              </button>
              <button
                onClick={() => handleQuickFilter(30)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filters.dueInDays === 30
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Expira em 30 dias
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <UserTable
          users={users}
          loading={loading}
          onEditUser={setSelectedUser}
          onSort={handleSort}
          sortField={sort.field}
          sortDirection={sort.direction}
        />

        {/* Paginação */}
        {pagination.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Mostrando {(pagination.page - 1) * pagination.pageSize + 1} até{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
                {pagination.total} usuários
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(
                        Math.ceil(prev.total / prev.pageSize),
                        prev.page + 1
                      )
                    }))
                  }
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  )
}
