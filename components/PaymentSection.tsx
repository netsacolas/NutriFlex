import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { subscriptionService } from '../services/subscriptionService';

interface PaymentRecord {
  id: string;
  plan: string;
  amount_cents: number;
  currency: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
}

const PaymentSection: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, plan, isPremium, openCheckout } = useSubscription();
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const daysRemaining = subscriptionService.getDaysRemaining(subscription);
  const isExpiringSoon = subscriptionService.isExpiringSoon(subscription);
  const isExpired = subscriptionService.isExpired(subscription);
  const statusMessage = subscriptionService.getSubscriptionStatusMessage(subscription);
  const expirationDate = subscriptionService.formatExpirationDate(subscription);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await subscriptionService.getPaymentHistory(5);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getPlanName = (planId: string) => {
    const planNames: Record<string, string> = {
      free: 'Plano Grátis',
      premium_monthly: 'Premium Mensal',
      premium_quarterly: 'Premium Trimestral',
      premium_annual: 'Premium Anual'
    };
    return planNames[planId] || planId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      active: { label: 'Ativo', class: 'bg-green-100 text-green-700' },
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Pago', class: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700' },
      incomplete: { label: 'Incompleto', class: 'bg-gray-100 text-gray-700' }
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Card de Status da Assinatura */}
      <div className={`rounded-2xl p-6 shadow-lg border-2 ${
        isPremium
          ? 'bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200'
          : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {getPlanName(plan.id)}
            </h3>
            <p className={`text-sm font-medium ${
              isExpiringSoon ? 'text-orange-600' :
              isExpired ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {statusMessage}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPremium && subscription && (
              <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {subscription && subscription.plan !== 'free' && (
            <>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Início</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Vencimento</p>
                <p className={`text-sm font-bold ${
                  isExpiringSoon ? 'text-orange-600' :
                  isExpired ? 'text-red-600' :
                  'text-gray-900'
                }`}>
                  {expirationDate || '-'}
                </p>
              </div>

              {daysRemaining !== null && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Dias Restantes</p>
                  <p className={`text-2xl font-black ${
                    isExpiringSoon ? 'text-orange-600' :
                    isExpired ? 'text-red-600' :
                    'text-emerald-600'
                  }`}>
                    {daysRemaining}
                  </p>
                </div>
              )}
            </>
          )}

          {subscription?.plan === 'free' && (
            <div className="bg-white rounded-lg p-3 shadow-sm col-span-full">
              <p className="text-sm text-gray-700">
                <strong>Plano Grátis:</strong> 2 refeições/dia, histórico limitado a 5 registros.
              </p>
            </div>
          )}
        </div>

        {/* Alerta de Vencimento */}
        {isExpiringSoon && !isExpired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-orange-900 text-sm">Sua assinatura está próxima do vencimento!</p>
                <p className="text-xs text-orange-700 mt-1">
                  Renove agora para não perder o acesso aos recursos Premium.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Expirado */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-900 text-sm">Sua assinatura expirou</p>
                <p className="text-xs text-red-700 mt-1">
                  Você foi revertido para o plano gratuito. Renove para recuperar o acesso Premium.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isPremium && (
            <button
              onClick={() => navigate('/assinatura')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-cyan-700 transition-all"
            >
              ⭐ Assinar Premium
            </button>
          )}

          {isPremium && (isExpiringSoon || isExpired) && (
            <button
              onClick={() => navigate('/assinatura')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-700 transition-all"
            >
              🔄 Renovar Assinatura
            </button>
          )}

          {isPremium && !isExpiringSoon && !isExpired && (
            <button
              onClick={() => navigate('/assinatura')}
              className="flex-1 px-6 py-3 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              📊 Gerenciar Plano
            </button>
          )}
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Histórico de Pagamentos</h3>
          {paymentHistory.length > 0 && (
            <button
              onClick={loadPaymentHistory}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ↻ Atualizar
            </button>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando histórico...</p>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Nenhum pagamento registrado</p>
            <p className="text-sm mt-1">Seu histórico aparecerá aqui após o primeiro pagamento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Plano</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatDate(payment.paid_at || payment.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {getPlanName(payment.plan)}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-bold">
                      {formatCurrency(payment.amount_cents)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(payment.payment_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSection;
