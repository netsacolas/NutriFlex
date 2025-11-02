import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminService,
  AdminHistoryEntry,
  AdminMetrics,
  AdminSegment,
  AdminSubscriptionChange,
  AdminUserFilters,
  AdminUserRow
} from '../services/adminService'
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ArrowRightIcon
} from '../components/Layout/Icons'

type SortDirection = 'asc' | 'desc'

interface SortState {
  field: 'name' | 'email' | 'plan' | 'status' | 'expiration' | 'days_remaining' | 'updated_at'
  direction: SortDirection
}

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface EditFormState {
  plan: AdminUserRow['plan']
  startDate: string
  endDate: string
  addDays: number
  removeDays: number
  setDaysRemaining: number | null
  notes: string
  summary: string
}

type BulkMode = 'plan' | 'addDays' | 'removeDays'

interface BulkFormState {
  mode: BulkMode
  plan: AdminUserRow['plan']
  days: number
  notes: string
}

const DEFAULT_FILTERS: AdminUserFilters = {
  search: '',
  plans: [],
  status: [],
  dueInDays: null,
  startRange: { from: null, to: null },
  endRange: { from: null, to: null }
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const PLAN_OPTIONS: Array<{ value: AdminUserRow['plan']; label: string }> = [
  { value: 'free', label: 'Plano Gratuito' },
  { value: 'premium_monthly', label: 'Premium Mensal' },
  { value: 'premium_quarterly', label: 'Premium Trimestral' },
  { value: 'premium_annual', label: 'Premium Anual' }
]

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Pagamento em atraso' },
  { value: 'incomplete', label: 'Incompleto' },
  { value: 'cancelled', label: 'Cancelado' }
]

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const DATETIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const PLAN_BADGE_CLASS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  premium_monthly: 'bg-emerald-100 text-emerald-700',
  premium_quarterly: 'bg-indigo-100 text-indigo-700',
  premium_annual: 'bg-amber-100 text-amber-700'
}

const RISK_BADGE_CLASS: Record<string, string> = {
  expired: 'bg-red-100 text-red-600',
  due_3: 'bg-orange-100 text-orange-600',
  due_7: 'bg-yellow-100 text-yellow-700',
  due_15: 'bg-blue-100 text-blue-700',
  ok: 'bg-emerald-100 text-emerald-700',
  no_expiration: 'bg-slate-100 text-slate-600'
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  return DATE_FORMATTER.format(date)
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  return DATETIME_FORMATTER.format(date)
}

function formatDays(days: number) {
  if (days <= 0) return '0 dias'
  if (days === 1) return '1 dia'
  return `${days} dias`
}

function getRiskLabel(bucket: string) {
  switch (bucket) {
    case 'expired':
      return 'Expirado'
    case 'due_3':
      return 'Vencendo em 3 dias'
    case 'due_7':
      return 'Vencendo em 7 dias'
    case 'due_15':
      return 'Vencendo em 15 dias'
    case 'no_expiration':
      return 'Sem expiração'
    default:
      return 'Em dia'
  }
}

function toInputDate(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function addDays(base: string | null, days: number) {
  const start = base ? new Date(base) : new Date()
  if (Number.isNaN(start.getTime())) {
    return ''
  }
  start.setDate(start.getDate() + days)
  return start.toISOString().split('T')[0]
}

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; subtitle?: string }> = ({ icon, title, value, subtitle }) => (
  <div className="flex items-center gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
    <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
)

const RiskChip: React.FC<{ bucket: string }> = ({ bucket }) => {
  const label = getRiskLabel(bucket)
  const className = RISK_BADGE_CLASS[bucket] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {bucket === 'expired' && <ExclamationCircleIcon className="w-3.5 h-3.5" />}
      {bucket === 'ok' && <CheckCircleIcon className="w-3.5 h-3.5" />}
      {label}
    </span>
  )
}

const StatusChip: React.FC<{ plan: AdminUserRow['plan']; planLabel: string }> = ({ plan, planLabel }) => {
  const className = PLAN_BADGE_CLASS[plan] ?? 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {planLabel}
    </span>
  )
}

const EmptyState: React.FC<{ title: string; description: string; actionLabel?: string; onAction?: () => void }> = ({
  title,
  description,
  actionLabel,
  onAction
}) => (
  <div className="text-center py-24 border border-dashed border-emerald-200 rounded-3xl bg-emerald-50/40">
    <SparklesIcon className="w-10 h-10 mx-auto text-emerald-400" />
    <h3 className="mt-4 text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">{description}</p>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        <PlusCircleIcon className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
)

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' })
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 25, total: 0 })
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [segments, setSegments] = useState<AdminSegment[]>([])
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<AdminHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyUser, setHistoryUser] = useState<AdminUserRow | null>(null)
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [showSegmentModal, setShowSegmentModal] = useState(false)
  const [segmentForm, setSegmentForm] = useState({ name: '', description: '' })
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState<BulkFormState>({ mode: 'plan', plan: 'premium_monthly', days: 7, notes: '' })
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  const loadAccess = useCallback(async () => {
    const hasAccess = await adminService.checkIsAdmin()
    setIsAdmin(hasAccess)
    if (!hasAccess) {
      navigate('/home')
    }
  }, [navigate])

  useEffect(() => {
    void loadAccess()
  }, [loadAccess])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  const loadSegments = useCallback(async () => {
    const list = await adminService.listSegments()
    setSegments(list)
  }, [])

  const loadMetrics = useCallback(async () => {
    const data = await adminService.getMetrics()
    setMetrics(data)
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      clearMessages()
      const response = await adminService.listUsers({
        filters,
        sort,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      })
      setUsers(response.users)
      setPagination((prev) => ({ ...prev, total: response.total }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar usuários'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filters, sort, pagination.page, pagination.pageSize, clearMessages])

  useEffect(() => {
    if (isAdmin) {
      void loadUsers()
      void loadMetrics()
      void loadSegments()
    }
  }, [isAdmin, loadUsers, loadMetrics, loadSegments])

  useEffect(() => {
    if (!successMessage) {
      return
    }
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  const handleSort = (field: SortState['field']) => {
    setSort((prev) => {
      const direction = prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      return { field, direction }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ page: 1, pageSize, total: pagination.total })
  }

  const updateFilters = (partial: Partial<AdminUserFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value })
  }

  const togglePlanFilter = (plan: AdminUserRow['plan']) => {
    setFilters((prev) => {
      const plans = new Set(prev.plans ?? [])
      if (plans.has(plan)) {
        plans.delete(plan)
      } else {
        plans.add(plan)
      }
      return { ...prev, plans: Array.from(plans) }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => {
      const statuses = new Set(prev.status ?? [])
      if (statuses.has(status)) {
        statuses.delete(status)
      } else {
        statuses.add(status)
      }
      return { ...prev, status: Array.from(statuses) }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const selectAllVisible = (checked: boolean) => {
    if (checked) {
      const newSelection = new Set(selectedRows)
      users.forEach((user) => newSelection.add(user.userId))
      setSelectedRows(Array.from(newSelection))
    } else {
      const visibleIds = new Set(users.map((user) => user.userId))
      setSelectedRows((prev) => prev.filter((id) => !visibleIds.has(id)))
    }
  }

  const toggleRowSelection = (userId: string) => {
    setSelectedRows((prev) => (
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    ))
  }

  const buildEditFormState = (user: AdminUserRow): EditFormState => ({
    plan: user.plan,
    startDate: toInputDate(user.currentPeriodStart),
    endDate: toInputDate(user.currentPeriodEnd),
    addDays: 0,
    removeDays: 0,
    setDaysRemaining: null,
    notes: '',
    summary: ''
  })

  const openEditModal = (user: AdminUserRow) => {
    setEditUser(user)
    setEditForm(buildEditFormState(user))
  }

  const closeEditModal = () => {
    setEditUser(null)
    setEditForm(null)
  }

  const updateEditForm = (partial: Partial<EditFormState>) => {
    setEditForm((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  const handleEditQuickDays = (days: number) => {
    if (!editForm) return
    const base = editForm.endDate || editForm.startDate
    const newEnd = addDays(base, days)
    updateEditForm({ endDate: newEnd })
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser || !editForm) return

    if (editForm.endDate && editForm.startDate && editForm.endDate < editForm.startDate) {
      setError('A data de expiração não pode ser anterior à data de início.')
      return
    }

    try {
      setLoading(true)
      await adminService.updateSubscription({
        userId: editUser.userId,
        plan: editForm.plan,
        startDate: editForm.startDate || null,
        endDate: editForm.plan === 'free' ? null : (editForm.endDate || null),
        addDays: editForm.addDays || undefined,
        removeDays: editForm.removeDays || undefined,
        setDaysRemaining: editForm.setDaysRemaining ?? undefined,
        notes: editForm.notes || undefined,
        summary: editForm.summary || `Atualização manual de assinatura (${editUser.email})`
      })

      setSuccessMessage('Assinatura atualizada com sucesso.')
      closeEditModal()
      await loadUsers()
      await loadMetrics()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar assinatura'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const openHistoryModal = async (user: AdminUserRow) => {
    setHistoryUser(user)
    setHistoryEntries([])
    setHistoryLoading(true)
    try {
      const history = await adminService.getUserHistory(user.userId)
      setHistoryEntries(history)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico'
      setError(message)
    } finally {
      setHistoryLoading(false)
    }
  }

  const closeHistoryModal = () => {
    setHistoryUser(null)
    setHistoryEntries([])
  }

  const openSegmentModal = () => {
    setSegmentForm({ name: '', description: '' })
    setShowSegmentModal(true)
  }

  const closeSegmentModal = () => {
    setShowSegmentModal(false)
  }

  const saveCurrentSegment = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedFilters = { ...filters }
    try {
      const segment = await adminService.saveSegment(segmentForm.name, segmentForm.description || null, cleanedFilters)
      setSegments((prev) => [segment, ...prev.filter((s) => s.id !== segment.id)])
      setSuccessMessage('Segmento salvo com sucesso.')
      setActiveSegmentId(segment.id)
      setShowSegmentModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar segmento'
      setError(message)
    }
  }

  const applySegment = (segment: AdminSegment) => {
    setFilters(segment.filters ?? DEFAULT_FILTERS)
    setActiveSegmentId(segment.id)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const removeSegment = async (segmentId: string) => {
    try {
      await adminService.deleteSegment(segmentId)
      setSegments((prev) => prev.filter((segment) => segment.id !== segmentId))
      if (activeSegmentId === segmentId) {
        setActiveSegmentId(null)
      }
      setSuccessMessage('Segmento removido.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover segmento'
      setError(message)
    }
  }

  const openBulkModal = (mode: BulkMode) => {
    setBulkForm({
      mode,
      plan: 'premium_monthly',
      days: mode === 'removeDays' ? 7 : 30,
      notes: ''
    })
    setBulkModalOpen(true)
  }

  const closeBulkModal = () => {
    setBulkModalOpen(false)
  }

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRows.length === 0) {
      setError('Selecione ao menos um usuário para aplicar ações em massa.')
      return
    }

    const change: AdminSubscriptionChange = {
      notes: bulkForm.notes || undefined,
      actionLabel: `bulk_${bulkForm.mode}`,
      summary: `Ação em massa (${bulkForm.mode}) para ${selectedRows.length} usuários`
    }

    if (bulkForm.mode === 'plan') {
      change.plan = bulkForm.plan
    } else if (bulkForm.mode === 'addDays') {
      change.addDays = bulkForm.days
    } else if (bulkForm.mode === 'removeDays') {
      change.removeDays = bulkForm.days
    }

    try {
      setLoading(true)
      const result = await adminService.bulkUpdateSubscriptions({
        userIds: selectedRows,
        change
      })

      if (result.failed.length > 0) {
        const failureMessages = result.failed
          .map((item) => `• ${item.userId}: ${item.error}`)
          .join('\n')
        setError(`Algumas alterações falharam:\n${failureMessages}`)
      }

      if (result.success.length > 0) {
        setSuccessMessage(`Ação aplicada com sucesso em ${result.success.length} usuários.`)
      }

      closeBulkModal()
      setSelectedRows([])
      await loadUsers()
      await loadMetrics()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aplicar ação em massa'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportFiltered = async () => {
    try {
      setExportLoading(true)
      const { filename, csv } = await adminService.exportUsers({
        filters,
        sort,
        pagination: { page: 1, pageSize: pagination.total || 1000 }
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
      setSuccessMessage('Exportação concluída.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar usuários'
      setError(message)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportSelected = useCallback(async () => {
    if (selectedRows.length === 0) {
      setError('Selecione ao menos um usuário para exportar.')
      return
    }
    try {
      setExportLoading(true)
      const rows = await adminService.getUsersByIds(selectedRows)
      const csv = [
        'Nome;Email;Plano;Status;Início;Expiração;Dias restantes',
        ...rows.map((row) => [
          row.fullName ?? '',
          row.email,
          row.planLabel,
          row.statusLabel,
          formatDate(row.currentPeriodStart),
          formatDate(row.currentPeriodEnd),
          row.daysRemaining
        ].map((value) => String(value).replace(/;/g, ',')).join(';'))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `nutrimais-selecionados-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      setSuccessMessage('Exportação dos usuários selecionados concluída.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar seleção'
      setError(message)
    } finally {
      setExportLoading(false)
    }
  }, [selectedRows])

  const handleExportHistory = () => {
    if (!historyUser || historyEntries.length === 0) return
    const rows = historyEntries.map((entry) => [
      entry.createdAt,
      entry.actionType,
      JSON.stringify(entry.beforeState ?? {}),
      JSON.stringify(entry.afterState ?? {}),
      entry.notes ?? '',
      entry.adminEmail ?? ''
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))

    const csv = [
      'Data;Ação;Antes;Depois;Observações;Responsável',
      ...rows
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historico-${historyUser.email}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const selectedAllVisible = users.every((user) => selectedRows.includes(user.userId))
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="bg-white shadow-lg rounded-2xl px-8 py-6 flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-emerald-500 animate-pulse" />
          <p className="text-gray-700 font-medium">Validando credenciais administrativas...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-16">
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-sm uppercase tracking-wide bg-white/15 px-3 py-1 rounded-full">
              <SparklesIcon className="w-4 h-4" />
              Painel administrativo
            </span>
            <h1 className="mt-3 text-3xl font-bold">Controle total dos usuários</h1>
            <p className="text-emerald-50/80 mt-2 text-sm max-w-2xl">
              Visualize, filtre e ajuste planos de assinatura em segundos. Todas as ações ficam registradas com segurança para auditoria completa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-emerald-50 transition-all"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            Voltar ao app
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
            {error.split('\n').map((line, index) => <p key={index}>{line}</p>)}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-xl text-sm flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<SparklesIcon className="w-6 h-6" />}
            title="Usuários totais"
            value={metrics?.totalUsers ?? 0}
            subtitle="Todos os usuários com ou sem assinatura ativa"
          />
          <MetricCard
            icon={<ChartBarIcon className="w-6 h-6" />}
            title="Premium Mensal"
            value={metrics?.planCounts?.premium_monthly ?? 0}
            subtitle="Planos mensais ativos"
          />
          <MetricCard
            icon={<ChartBarIcon className="w-6 h-6" />}
            title="Premium Trimestral"
            value={metrics?.planCounts?.premium_quarterly ?? 0}
            subtitle="Planos trimestrais ativos"
          />
          <MetricCard
            icon={<ChartBarIcon className="w-6 h-6" />}
            title="Premium Anual"
            value={metrics?.planCounts?.premium_annual ?? 0}
            subtitle="Planos anuais ativos"
          />
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Busca rápida
              </label>
              <input
                type="search"
                value={filters.search ?? ''}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Busque por nome ou e-mail..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo de plano</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLAN_OPTIONS.map((option) => {
                    const active = filters.plans?.includes(option.value) ?? false
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => togglePlanFilter(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Situação</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_FILTER_OPTIONS.map((option) => {
                    const active = filters.status?.includes(option.value) ?? false
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleStatusFilter(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Vencimento em (dias)</label>
                <input
                  type="number"
                  min={0}
                  value={filters.dueInDays ?? ''}
                  onChange={(event) => updateFilters({ dueInDays: event.target.value ? Number(event.target.value) : null })}
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: 7"
                />
                <div className="flex gap-2 mt-2">
                  {[3, 7, 15].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => updateFilters({ dueInDays: days })}
                      className="px-2 py-1 text-xs border border-emerald-200 text-emerald-600 rounded-md hover:bg-emerald-50 transition"
                    >
                      {days} dias
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Período</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.startRange?.from ?? ''}
                    onChange={(event) => updateFilters({ startRange: { ...filters.startRange, from: event.target.value || null } })}
                    className="px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Início"
                  />
                  <input
                    type="date"
                    value={filters.startRange?.to ?? ''}
                    onChange={(event) => updateFilters({ startRange: { ...filters.startRange, to: event.target.value || null } })}
                    className="px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Fim"
                  />
                  <input
                    type="date"
                    value={filters.endRange?.from ?? ''}
                    onChange={(event) => updateFilters({ endRange: { ...filters.endRange, from: event.target.value || null } })}
                    className="px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Expiração de"
                  />
                  <input
                    type="date"
                    value={filters.endRange?.to ?? ''}
                    onChange={(event) => updateFilters({ endRange: { ...filters.endRange, to: event.target.value || null } })}
                    className="px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Expiração até"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openSegmentModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Salvar filtros como segmento
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters(DEFAULT_FILTERS)
                setActiveSegmentId(null)
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline"
            >
              Limpar filtros
            </button>
            <div className="flex flex-wrap gap-2">
              {segments.map((segment) => (
                <div key={segment.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${activeSegmentId === segment.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 bg-white'}`}>
                  <button type="button" onClick={() => applySegment(segment)}>
                    {segment.name}
                  </button>
                  <button type="button" onClick={() => removeSegment(segment.id)} aria-label={`Remover segmento ${segment.name}`} className="text-gray-400 hover:text-red-500">
                    ×
                  </button>
                </div>
              ))}
              {segments.length === 0 && (
                <span className="text-xs text-gray-400">Nenhum segmento salvo ainda.</span>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Usuários</h2>
              <p className="text-sm text-gray-500">
                {pagination.total} usuário(s) encontrados — Página {pagination.page} de {totalPages}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportFiltered}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exportLoading}
              >
                <SparklesIcon className="w-4 h-4" />
                {exportLoading ? 'Exportando...' : 'Exportar lista filtrada'}
              </button>
              <select
                value={pagination.pageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} por página</option>
                ))}
              </select>
            </div>
          </div>

          {selectedRows.length > 0 && (
            <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex flex-wrap items-center gap-3 text-sm text-emerald-800">
              <span className="font-medium">{selectedRows.length} usuário(s) selecionados.</span>
              <button type="button" onClick={() => openBulkModal('plan')} className="underline hover:text-emerald-900">
                Alterar plano em massa
              </button>
              <button type="button" onClick={() => openBulkModal('addDays')} className="underline hover:text-emerald-900">
                Adicionar dias
              </button>
              <button type="button" onClick={() => openBulkModal('removeDays')} className="underline hover:text-emerald-900">
                Remover dias
              </button>
              <button type="button" onClick={handleExportSelected} className="underline hover:text-emerald-900">
                Exportar CSV dos selecionados
              </button>
              <button type="button" onClick={() => setSelectedRows([])} className="text-red-500 hover:text-red-600 underline underline-offset-4">
                Limpar seleção
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedAllVisible}
                      onChange={(event) => selectAllVisible(event.target.checked)}
                    />
                  </th>
                  {[
                    { key: 'name', label: 'Usuário' },
                    { key: 'plan', label: 'Plano' },
                    { key: 'status', label: 'Status' },
                    { key: 'expiration', label: 'Expira em' },
                    { key: 'days_remaining', label: 'Dias' },
                    { key: 'updated_at', label: 'Atualizado' },
                    { key: 'actions', label: 'Ações' }
                  ].map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left font-semibold">
                      {column.key === 'actions' ? column.label : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                          onClick={() => handleSort(column.key as SortState['field'])}
                        >
                          {column.label}
                          {sort.field === column.key && (
                            <span className="text-xs">
                              {sort.direction === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      Carregando dados do painel...
                    </td>
                  </tr>
                )}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10">
                      <EmptyState
                        title="Nenhum usuário encontrado"
                        description="Tente ajustar os filtros, ampliar o período ou redefinir a busca para visualizar outros usuários."
                        actionLabel="Limpar filtros"
                        onAction={() => {
                          setFilters(DEFAULT_FILTERS)
                          setActiveSegmentId(null)
                        }}
                      />
                    </td>
                  </tr>
                )}

                {!loading && users.map((user) => {
                  const selected = selectedRows.includes(user.userId)
                  return (
                    <tr key={user.userId} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRowSelection(user.userId)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800">{user.fullName ?? 'Nome não informado'}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                          <div className="flex gap-2">
                            <RiskChip bucket={user.riskBucket} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusChip plan={user.plan} planLabel={user.planLabel} />
                          <span className="text-xs text-gray-500">{user.userCreatedAt ? `Criado em ${formatDate(user.userCreatedAt)}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{user.statusLabel}</span>
                        {user.lastPaymentStatus && (
                          <p className="text-xs text-gray-400 mt-1">
                            Último pagamento: {user.lastPaymentStatus} em {formatDate(user.lastPaymentAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-700">{formatDate(user.currentPeriodEnd)}</span>
                          <span className="text-xs text-gray-500">Início: {formatDate(user.currentPeriodStart)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDays(user.daysRemaining ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => openHistoryModal(user)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                          >
                            Histórico
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {users.length > 0 && (
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Página {pagination.page} de {totalPages}</span>
                <span>•</span>
                <span>{pagination.total} registro(s) ao todo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                >
                  Anterior
                </button>
                <span className="font-medium">{pagination.page}</span>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition"
                  disabled={pagination.page >= totalPages}
                  onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Guia rápido</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
              <h3 className="font-semibold text-emerald-700 mb-2">Filtros e segmentos</h3>
              <p>
                Combine filtros por plano, situação, período e dias restantes. Salve configurações frequentes como segmentos nomeados para reutilizar com um clique.
              </p>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
              <h3 className="font-semibold text-emerald-700 mb-2">Edição segura</h3>
              <p>
                Ajuste plano, datas e dias restantes sempre com resumo e confirmação. Toda mudança registra auditoria completa (antes → depois) com autor e observações.
              </p>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
              <h3 className="font-semibold text-emerald-700 mb-2">Ações em massa</h3>
              <p>
                Selecione múltiplos usuários para alterar plano, adicionar/remover dias ou exportar CSV. Revise sempre o resumo antes de confirmar a operação.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Changelog (painel administrativo)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Nova listagem dinâmica com filtros combináveis, ordenação, paginação e etiquetas visuais de risco.</li>
            <li>Editor avançado de assinatura com ajustes rápidos de dias, alterações de plano e confirmações explícitas.</li>
            <li>Ações em massa com resumo de impacto, confirmação e exportação CSV dos usuários selecionados.</li>
            <li>Histórico completo com auditoria (antes → depois), motivos e exportação dedicada.</li>
            <li>Segmentos nomeados para reutilizar filtros, indicadores de contagem por plano e atalhos de risco.</li>
          </ul>
        </section>
      </main>

      {showSegmentModal && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Salvar segmento de filtros</h3>
            <form onSubmit={saveCurrentSegment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do segmento</label>
                <input
                  required
                  value={segmentForm.name}
                  onChange={(event) => setSegmentForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Vencendo em 7 dias"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={segmentForm.description}
                  onChange={(event) => setSegmentForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Notas sobre a segmentação"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeSegmentModal} className="text-sm text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                  Salvar segmento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && editForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Editar assinatura</h3>
                <p className="text-sm text-gray-500">Ajuste plano, datas e dias restantes de {editUser.email}.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                  <select
                    value={editForm.plan}
                    onChange={(event) => updateEditForm({ plan: event.target.value as AdminUserRow['plan'] })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(event) => updateEditForm({ startDate: event.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={editForm.plan === 'free'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de expiração</label>
                  <input
                    type="date"
                    value={editForm.plan === 'free' ? '' : editForm.endDate}
                    onChange={(event) => updateEditForm({ endDate: event.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={editForm.plan === 'free'}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[30, 90, 365].map((days) => (
                      <button
                        key={days}
                        type="button"
                        disabled={editForm.plan === 'free'}
                        onClick={() => handleEditQuickDays(days)}
                        className="px-2 py-1 rounded-md border border-emerald-200 text-emerald-600 text-xs hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hoje +{days}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ajustes rápidos</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Adicionar dias</span>
                      <input
                        type="number"
                        min={0}
                        value={editForm.addDays}
                        onChange={(event) => updateEditForm({ addDays: Number(event.target.value) })}
                        className="w-full mt-1 px-2 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Remover dias</span>
                      <input
                        type="number"
                        min={0}
                        value={editForm.removeDays}
                        onChange={(event) => updateEditForm({ removeDays: Number(event.target.value) })}
                        className="w-full mt-1 px-2 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Definir dias</span>
                      <input
                        type="number"
                        min={0}
                        value={editForm.setDaysRemaining ?? ''}
                        onChange={(event) => updateEditForm({ setDaysRemaining: event.target.value ? Number(event.target.value) : null })}
                        className="w-full mt-1 px-2 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo/observações</label>
                <textarea
                  value={editForm.notes}
                  onChange={(event) => updateEditForm({ notes: event.target.value })}
                  className="w-full min-h-[96px] px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Justifique a alteração para auditoria (ex.: upgrade manual, cortesia, ajuste de pagamento)."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumo da alteração</label>
                <textarea
                  value={editForm.summary}
                  onChange={(event) => updateEditForm({ summary: event.target.value })}
                  className="w-full min-h-[72px] px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="Ex.: Alterar para Premium Mensal com +30 dias de cortesia."
                  required
                />
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
                <p className="font-semibold mb-2">Confirmação</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Plano final: <strong>{PLAN_OPTIONS.find((plan) => plan.value === editForm.plan)?.label ?? editForm.plan}</strong>.</li>
                  <li>Período: <strong>{editForm.startDate || 'hoje'} → {editForm.plan === 'free' ? 'Sem expiração (free)' : (editForm.endDate || 'definir')}</strong>.</li>
                  <li>Ajuste de dias: +{editForm.addDays} / -{editForm.removeDays}{editForm.setDaysRemaining !== null ? ` • Forçar ${editForm.setDaysRemaining} dias restantes` : ''}.</li>
                  <li>Notas serão registradas na auditoria e visíveis no histórico administrativo.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeEditModal} className="text-sm text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Confirmar alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyUser && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Histórico de {historyUser.email}</h3>
                <p className="text-xs text-gray-500">Todas as ações administrativas registradas com antes → depois.</p>
              </div>
              <button type="button" onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={handleExportHistory}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
              >
                <SparklesIcon className="w-4 h-4" />
                Exportar histórico (CSV)
              </button>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{historyEntries.length} registro(s)</span>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {historyLoading && (
                <p className="text-sm text-gray-500">Carregando histórico...</p>
              )}
              {!historyLoading && historyEntries.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma alteração administrativa registrada para este usuário.</p>
              )}
              {!historyLoading && historyEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/60">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{formatDateTime(entry.createdAt)}</span>
                    <span>{entry.adminEmail ?? 'Administrador desconhecido'}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{entry.actionType}</p>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium text-gray-700">Motivo:</span> {entry.notes}
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="font-semibold text-gray-700 mb-1">Antes</p>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">{JSON.stringify(entry.beforeState ?? {}, null, 2)}</pre>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="font-semibold text-gray-700 mb-1">Depois</p>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">{JSON.stringify(entry.afterState ?? {}, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {bulkModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Ação em massa ({selectedRows.length} usuário(s))</h3>
              <button type="button" onClick={closeBulkModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmitBulk} className="p-6 space-y-4 text-sm text-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ação</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { mode: 'plan', label: 'Alterar plano' },
                    { mode: 'addDays', label: 'Adicionar dias' },
                    { mode: 'removeDays', label: 'Remover dias' }
                  ].map((option) => (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => setBulkForm((prev) => ({ ...prev, mode: option.mode as BulkMode }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        bulkForm.mode === option.mode
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {bulkForm.mode === 'plan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plano destino</label>
                  <select
                    value={bulkForm.plan}
                    onChange={(event) => setBulkForm((prev) => ({ ...prev, plan: event.target.value as AdminUserRow['plan'] }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {bulkForm.mode !== 'plan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{bulkForm.mode === 'addDays' ? 'Adicionar dias' : 'Remover dias'}</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkForm.days}
                    onChange={(event) => setBulkForm((prev) => ({ ...prev, days: Number(event.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={bulkForm.notes}
                  onChange={(event) => setBulkForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full min-h-[96px] px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Descreva a razão desta ação em massa."
                  required
                />
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
                <p className="font-semibold mb-2">Resumo da operação</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{selectedRows.length} usuário(s) serão impactados.</li>
                  {bulkForm.mode === 'plan' && <li>Plano final: <strong>{PLAN_OPTIONS.find((option) => option.value === bulkForm.plan)?.label ?? bulkForm.plan}</strong>.</li>}
                  {bulkForm.mode === 'addDays' && <li>Todos receberão +{bulkForm.days} dia(s) no período ativo.</li>}
                  {bulkForm.mode === 'removeDays' && <li>Serão removidos {bulkForm.days} dia(s) do período restante.</li>}
                  <li>Uma auditoria única será registrada com as observações informadas.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeBulkModal} className="text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                  Confirmar ação em massa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
