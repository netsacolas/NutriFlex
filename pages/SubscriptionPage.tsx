import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { subscriptionService } from '../services/subscriptionService';
import type { PlanTierDefinition } from '../types';

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

  const plans = useMemo(() => subscriptionService.getPlanList(), []);
  const premiumPlans = useMemo(
    () => plans.filter((item) => item.id !== 'free'),
    [plans]
  );

  const activePlanId = subscription?.status === 'active' ? subscription.plan : 'free';
  const billingInfo = formatDate(subscription?.current_period_end);

  const renderPlanCard = (planDef: PlanTierDefinition) => {
    const isCurrent = activePlanId === planDef.id;
    const isFreePlan = planDef.id === 'free';

    return (
      <div
        key={planDef.id}
        className={`flex flex-col gap-4 bg-white border rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1 ${
          isCurrent ? 'border-emerald-400 shadow-emerald-100' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{planDef.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{planDef.priceLabel}</p>
          </div>
          {isCurrent && (
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
              Plano atual
            </span>
          )}
        </div>

        <ul className="space-y-2 text-sm text-gray-700">
          {planDef.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {isFreePlan && (
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Continuar usando gratis
            </button>
          )}

          {!isFreePlan && (
            <button
              onClick={() => openCheckout(planDef.id)}
              disabled={isCurrent}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isCurrent
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {isCurrent ? 'Plano ativo' : 'Assinar agora'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 pt-12 pb-10 shadow-lg">
        <div className="max-w-5xl mx-auto text-white">
          <h1 className="text-3xl font-bold mb-2">Planos NutriMais</h1>
          <p className="text-white/80">
            Defina o plano ideal para o seu ritmo e desbloqueie todo o potencial da plataforma.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <section className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Plano atual</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {isPremium ? 'Premium ativado' : 'Plano gratuito'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Validade</p>
              <p className="text-lg font-semibold text-gray-900">
                {billingInfo || 'Sem data de expiração'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Limite de refeições</p>
              <p className="text-lg font-semibold text-gray-900">
                {plan.limits.maxMealsPerDay !== null
                  ? `${plan.limits.maxMealsPerDay} por dia`
                  : 'Ilimitado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Histórico</p>
              <p className="text-lg font-semibold text-gray-900">
                {plan.limits.historyItems !== null
                  ? `Ultimos ${plan.limits.historyItems} registros`
                  : 'Completo'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => refresh()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Atualizar status
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Voltar ao perfil
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assinaturas Premium</h2>
              <p className="text-gray-600 text-sm">
                Escolha a melhor forma de pagamento e tenha acesso completo ao NutriMais AI.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {premiumPlans.map((planDef) => renderPlanCard(planDef))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparativo de beneficios</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <h3 className="text-lg font-bold text-emerald-700 mb-2">Plano Gratuito</h3>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>• Registrar ate 2 refeicoes por dia</li>
                <li>• Historico dos ultimos 5 lancamentos</li>
                <li>• Recalcular com IA no painel de saude</li>
                <li>• Planejamento nutricional basico</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <h3 className="text-lg font-bold text-purple-700 mb-2">Plano Premium</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Refeicoes ilimitadas e historico completo</li>
                <li>• Relatorios detalhados e insights personalizados</li>
                <li>• Assistente de IA completo (chat, analises e comparativos)</li>
                <li>• Prioridade no roadmap e novidades do produto</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubscriptionPage;
