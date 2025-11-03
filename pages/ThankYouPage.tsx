import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../services/supabaseClient';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, refresh, isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const planParam = searchParams.get('plan') || 'premium';
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    // Atualiza o status da assinatura E sincroniza via API
    // SEMPRE executa a sincronização, mesmo se o usuário clicar em outro link
    const updateSubscription = async () => {
      setIsLoading(true);

      try {
        // Primeiro, tentar sincronizar via API Kiwify
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const userEmail = sessionData?.session?.user?.email;

        if (token && userEmail) {
          // Chamar sync_manual para sincronizar a compra recente
          // Esta chamada sempre executa, garantindo que o plano seja ativado
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kiwify-api`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                action: 'sync_manual',
                emails: [userEmail],
                // Buscar compras das últimas 24 horas
                since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              }),
            }
          ).catch(err => console.error('Erro ao sincronizar:', err));
        }
      } catch (error) {
        console.error('Erro na sincronização:', error);
      }

      // Atualizar contexto de assinatura
      await refresh();
      setTimeout(() => setIsLoading(false), 2000);
    };

    updateSubscription();

    // Dependências vazias = executa apenas uma vez ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Countdown para redirecionamento automático para a Home
    if (countdown > 0 && !isLoading) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate('/');
    }
  }, [countdown, isLoading, navigate]);

  const getPlanName = (plan: string) => {
    const plans: Record<string, string> = {
      premium_monthly: 'Premium Mensal',
      premium_quarterly: 'Premium Trimestral',
      premium_annual: 'Premium Anual',
      premium: 'Premium'
    };
    return plans[plan] || 'Premium';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header com animação */}
          <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZ2OGgtOFYxNnptLTE0IDB2OGgtOFYxNnptMTQgMTR2OGgtOFYzMHptLTE0IDB2OGgtOFYzMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            {/* Ícone de Sucesso Animado */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Círculos decorativos */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-pulse" />
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-2 relative z-10">
              Parabéns! 🎉
            </h1>
            <p className="text-xl text-white/90 relative z-10">
              Sua assinatura foi confirmada com sucesso!
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8 space-y-6">
            {/* Status da Assinatura */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium">Ativando sua assinatura Premium...</p>
              </div>
            ) : (
              <>
                {/* Informações do Plano */}
                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Plano Ativado</p>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {getPlanName(planParam)}
                      </h3>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>

                  {subscription && isPremium && subscription.current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Válido até: <strong>{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong>
                      </span>
                    </div>
                  )}

                  {transactionId && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-xs text-gray-500">
                        ID da transação: <code className="bg-white px-2 py-1 rounded text-emerald-600">{transactionId}</code>
                      </p>
                    </div>
                  )}
                </div>

                {/* Benefícios Desbloqueados */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recursos Desbloqueados
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { icon: '🍽️', text: 'Refeições ilimitadas por dia' },
                      { icon: '📊', text: 'Histórico completo sem restrições' },
                      { icon: '🤖', text: 'Assistente IA completo com chat' },
                      { icon: '📈', text: 'Análises nutricionais detalhadas' },
                      { icon: '📝', text: 'Relatórios personalizados' },
                      { icon: '⚡', text: 'Suporte prioritário' }
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200 hover:border-emerald-300 transition-colors">
                        <span className="text-2xl">{benefit.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Próximos Passos */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Próximos Passos
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Explore o <strong>Dashboard Premium</strong> com todos os recursos desbloqueados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Converse com o <strong>Assistente IA</strong> para tirar dúvidas nutricionais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Planeje suas refeições sem limites e acompanhe seu progresso</span>
                    </li>
                  </ol>
                </div>

                {/* Countdown */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Redirecionando para a página inicial em <strong className="text-emerald-600">{countdown}s</strong>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(10 - countdown) * 10}%` }}
                    />
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-cyan-700 transition-all transform hover:-translate-y-0.5"
                  >
                    🏠 Voltar para Início
                  </button>
                  <button
                    onClick={() => navigate('/app')}
                    className="flex-1 px-6 py-4 bg-white border-2 border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors"
                  >
                    🚀 Ir para o Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-600 text-sm">
            🎁 Obrigado por escolher o <strong>NutriMais AI</strong>!
          </p>
          <p className="text-gray-500 text-xs">
            Qualquer dúvida, entre em contato com nosso suporte prioritário
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
