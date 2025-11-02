import React, { useState } from 'react'
import { AdminUserRow } from '../../services/adminService'

interface EditUserModalProps {
  user: AdminUserRow
  onClose: () => void
  onSave: (userId: string, changes: {
    plan?: 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual'
    endDate?: string | null
    addDays?: number
    notes?: string
  }) => Promise<void>
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [plan, setPlan] = useState(user.plan)
  const [endDate, setEndDate] = useState(
    user.currentPeriodEnd ? user.currentPeriodEnd.split('T')[0] : ''
  )
  const [addDays, setAddDays] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const changes: any = {}

      // Só incluir mudanças
      if (plan !== user.plan) {
        changes.plan = plan
      }

      if (endDate && endDate !== user.currentPeriodEnd?.split('T')[0]) {
        changes.endDate = endDate
      }

      if (addDays !== 0) {
        changes.addDays = addDays
      }

      if (notes.trim()) {
        changes.notes = notes.trim()
      }

      await onSave(user.userId, changes)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Renovar +30 dias', days: 30 },
    { label: 'Renovar +90 dias', days: 90 },
    { label: 'Renovar +365 dias', days: 365 }
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Editar Usuário</h2>
              <p className="text-indigo-100 mt-1">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Usuário */}
          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Plano Atual:</span>
              <p className="font-semibold text-slate-900">{user.planLabel}</p>
            </div>
            <div>
              <span className="text-slate-600">Status:</span>
              <p className="font-semibold text-slate-900">{user.statusLabel}</p>
            </div>
            <div>
              <span className="text-slate-600">Dias Restantes:</span>
              <p className="font-semibold text-slate-900">{user.daysRemaining} dias</p>
            </div>
            <div>
              <span className="text-slate-600">Expiração Atual:</span>
              <p className="font-semibold text-slate-900">
                {user.currentPeriodEnd
                  ? new Date(user.currentPeriodEnd).toLocaleDateString('pt-BR')
                  : 'Sem expiração'}
              </p>
            </div>
          </div>

          {/* Alterar Plano */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Novo Plano
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              <option value="free">Gratuito</option>
              <option value="premium_monthly">Premium Mensal (30 dias)</option>
              <option value="premium_quarterly">Premium Trimestral (90 dias)</option>
              <option value="premium_annual">Premium Anual (365 dias)</option>
            </select>
          </div>

          {/* Ações Rápidas de Renovação */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ações Rápidas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.days}
                  type="button"
                  onClick={() => setAddDays(action.days)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    addDays === action.days
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Adicionar/Remover Dias Manual */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ajustar Dias Manualmente
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddDays(Math.max(0, addDays - 1))}
                className="px-4 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors font-bold text-xl"
              >
                −
              </button>
              <input
                type="number"
                value={addDays}
                onChange={(e) => setAddDays(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-center font-bold text-lg"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setAddDays(addDays + 1)}
                className="px-4 py-3 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-xl"
              >
                +
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {addDays > 0
                ? `Adicionar ${addDays} ${addDays === 1 ? 'dia' : 'dias'} ao plano`
                : 'Nenhum ajuste de dias'}
            </p>
          </div>

          {/* Data de Expiração Manual */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ou Definir Data de Expiração Diretamente
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Renovação manual solicitada pelo cliente..."
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
