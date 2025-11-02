import React from 'react'
import { AdminUserRow } from '../../services/adminService'

interface UserTableProps {
  users: AdminUserRow[]
  loading: boolean
  onEditUser: (user: AdminUserRow) => void
  onSort?: (field: string) => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onEditUser,
  onSort,
  sortField,
  sortDirection
}) => {
  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-slate-100 text-slate-700',
      premium_monthly: 'bg-emerald-100 text-emerald-700',
      premium_quarterly: 'bg-indigo-100 text-indigo-700',
      premium_annual: 'bg-amber-100 text-amber-700'
    }
    return colors[plan as keyof typeof colors] || colors.free
  }

  const getStatusBadge = (days: number) => {
    if (days <= 0) return 'bg-red-100 text-red-700'
    if (days <= 7) return 'bg-orange-100 text-orange-700'
    if (days <= 30) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const SortableHeader: React.FC<{ field: string; label: string }> = ({ field, label }) => (
    <th
      onClick={() => onSort?.(field)}
      className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (
          <span className="text-indigo-600">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhum usuário encontrado
          </h3>
          <p className="mt-2 text-slate-600">
            Tente ajustar os filtros ou realizar uma nova busca
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader field="email" label="Usuário" />
              <SortableHeader field="plan" label="Plano" />
              <SortableHeader field="status" label="Status" />
              <SortableHeader field="days_remaining" label="Dias Restantes" />
              <SortableHeader field="expiration" label="Expiração" />
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-slate-900">{user.fullName || 'Sem nome'}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadge(
                      user.plan
                    )}`}
                  >
                    {user.planLabel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{user.statusLabel}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      user.daysRemaining
                    )}`}
                  >
                    {user.daysRemaining} {user.daysRemaining === 1 ? 'dia' : 'dias'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {user.currentPeriodEnd
                    ? new Date(user.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onEditUser(user)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
