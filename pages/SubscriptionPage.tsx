import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { subscriptionService } from '../services/subscriptionService';
import type { PlanTierDefinition } from '../types';
import { Toast } from '../components/Toast';

const formatDate = (value: string | null) => {
  if (!value) {
    return null;
  }
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return null;
  }
};

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, plan, isPremium, refresh, openCheckout } = useSubscription();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const plans = useMemo(() => subscriptionService.getPlanList(), []);
  const premiumPlans = useMemo(
    () => plans.filter((item) => item.id !== 'free'),
    [plans]
  );

  const activePlanId = subscription?.status === 'active' ? subscription.plan : 'free';
  const billingInfo = formatDate(subscription?.current_period_end);

  const handleCheckout = (planId: string) => {
    try {
      openCheckout(planId as any);
      setToast({ message: 'Redirecionando para o checkout seguro...', type: 'success' });
    } catch (error) {
      setToast({ message: 'Não foi possível abrir o checkout. Tente novamente.', type: 'error' });
    }
  };

  const getBadgeForPlan = (planId: string) => {
    if (planId === 'premium_annual') {
      return (
        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          MAIS VANTAJOSO
        </span>
      );
    }
    if (planId === 'premium_quarterly') {
      return (
        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          POPULAR
        </span>
      );
    }
    return null;
  };

  const renderPlanCard = (planDef: PlanTierDefinition) => {
    const isCurrent = activePlanId === planDef.id;
    const isRecommended = planDef.id === 'premium_annual';

    return (
      <div
        key={planDef.id}
        className={`relative flex flex-col gap-5 bg-white border-2 rounded-3xl p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
          isRecommended
            ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-white'
            : isCurrent
            ? 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white'
            : 'border-gray-200 hover:border-emerald-300'
        }`}
      >
        {getBadgeForPlan(planDef.id)}

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{planDef.name}</h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-emerald-600">
              {planDef.priceLabel.split('/')[0]}
            </span>
            {planDef.priceLabel.includes('/') && (
              <span className="text-lg text-gray-600">
                /{planDef.priceLabel.split('/')[1]}
              </span>
            )}
          </div>
          {isCurrent && (
            <span className="inline-block mt-3 px-4 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-full shadow-sm">
              ✓ PLANO ATIVO
            </span>
          )}
        </div>

        <ul className="space-y-3 flex-1">
          {planDef.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleCheckout(planDef.id)}
          disabled={isCurrent}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            isCurrent
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isRecommended
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:from-emerald-600 hover:to-cyan-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isCurrent ? '✓ Plano Ativo' : 'Assinar Agora'}
        </button>
      </div>
    );
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 pb-20">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 px-4 pt-16 pb-20 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoLThWMTZ6bS0xNCAwdjhoLThWMTZ6bTE0IDE0djhoLThWMzB6bS0xNCAwdjhoLThWMzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Escolha seu plano e comece agora
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Transparente, sem letra miúda. Você pode cancelar quando quiser.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-10">
          {/* Status do plano atual */}
          {isPremium && (
            <div className="mb-10 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-3xl shadow-2xl p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-2xl font-bold">Assinatura Premium Ativa</h2>
                  </div>
                  <p className="text-white/90">
                    Válido até: <span className="font-semibold">{billingInfo || 'Processando...'}</span>
                  </p>
                </div>
                <button
                  onClick={() => refresh()}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all"
                >
                  Atualizar Status
                </button>
              </div>
            </div>
          )}

          {/* Título da seção de planos */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Planos Premium
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Desbloqueie todo o potencial do NutriMais com recursos ilimitados
            </p>
          </div>

          {/* Grid de planos */}
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {premiumPlans.map((planDef) => renderPlanCard(planDef))}
          </div>

          {/* Selos de segurança */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
            <h3 className="text-center text-xl font-bold text-gray-900 mb-6">
              Pagamento 100% Seguro
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Segurança SSL</p>
                  <p className="text-xs text-gray-500">Certificado 256-bit</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Kiwify</p>
                  <p className="text-xs text-gray-500">Processamento confiável</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Privacidade</p>
                  <p className="text-xs text-gray-500">Dados protegidos</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Perguntas Frequentes
            </h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              <details className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>Como funciona a renovação?</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  A renovação é automática de acordo com o plano escolhido. Você pode cancelar a qualquer momento sem multas ou taxas adicionais.
                </p>
              </details>

              <details className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>Posso cancelar quando quiser?</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  Sim! Você tem total liberdade para cancelar sua assinatura a qualquer momento. Não há período de fidelidade ou taxas de cancelamento.
                </p>
              </details>

              <details className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>O que acontece se eu não renovar?</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  Você volta automaticamente para o plano gratuito. Seus dados são preservados, mas os limites do plano Free são aplicados (2 refeições/dia, histórico limitado).
                </p>
              </details>
            </div>
          </div>

          {/* Botão voltar */}
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
