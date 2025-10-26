import React, { useState, useCallback, useEffect } from 'react';
import { PWAManager } from './components/PWAComponents';
import { initBackgroundSync, SyncStatusBadge } from './utils/backgroundSync';
import { MealPlanner } from './components/MealPlanner';
import { MealResultDisplay } from './components/MealResult';
import { AuthFlow } from './components/Auth/AuthFlow';
import { ProfileModal } from './components/UserPanel/ProfileModal';
import { HealthModal } from './components/UserPanel/HealthModal';
import { HistoryModal } from './components/UserPanel/HistoryModal';
import CostAnalysisModal from './components/UserPanel/CostAnalysisModal';
import { calculateMealPortions } from './services/geminiService';
import { isAdmin } from './services/costAnalysisService';
import { useAuth } from './contexts/AuthContext';
import type { MealResult, MealType } from './types';

type ModalType = 'profile' | 'health' | 'history' | 'costs' | null;

const App: React.FC = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [mealResult, setMealResult] = useState<MealResult | null>(null);
    const [currentMealType, setCurrentMealType] = useState<MealType>('lunch');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);

    // Inicializar PWA e sistema de sincronização
    useEffect(() => {
        console.log('🚀 Inicializando PWA...');
        initBackgroundSync();
    }, []);

    // Verificar se usuário é admin
    useEffect(() => {
        async function checkAdmin() {
            if (user) {
                const adminStatus = await isAdmin();
                setIsUserAdmin(adminStatus);
            }
        }
        checkAdmin();
    }, [user]);

    const handleCalculate = useCallback(async (foods: string[], targetCalories: number, mealType: MealType) => {
        setIsLoading(true);
        setError(null);
        setMealResult(null);
        setCurrentMealType(mealType);

        try {
            const result = await calculateMealPortions(foods, targetCalories, mealType);
            setMealResult(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Loading state durante verificação de autenticação
    if (authLoading) {
        return (
            <div className="min-h-screen bg-primary-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-orange mx-auto mb-4"></div>
                    <p className="text-text-secondary">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não estiver autenticado, mostrar fluxo de autenticação
    if (!user) {
        return <AuthFlow />;
    }

    // Usuário autenticado - mostrar aplicação principal
    return (
        <>
            {/* Componentes PWA */}
            <PWAManager />
            <SyncStatusBadge />

            <div className="min-h-screen bg-primary-bg text-text-primary font-sans p-4 md:p-8">
                <main className="max-w-7xl mx-auto">
                <header className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-orange to-accent-coral text-transparent bg-clip-text pb-2 mb-6">
                        NutriMais AI
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                        A dieta que se adapta a você. Escolha os alimentos, defina sua meta de calorias e a IA calcula as porções perfeitas.
                    </p>

                    {/* Botões de Navegação */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <button
                            onClick={() => setActiveModal('profile')}
                            className="group relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <span className="text-2xl">👤</span>
                            <span className="relative z-10">Perfil</span>
                        </button>
                        <button
                            onClick={() => setActiveModal('health')}
                            className="group relative bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <span className="text-2xl">💪</span>
                            <span className="relative z-10">Saúde</span>
                        </button>
                        <button
                            onClick={() => setActiveModal('history')}
                            className="group relative bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <span className="text-2xl">📊</span>
                            <span className="relative z-10">Histórico</span>
                        </button>
                        {isUserAdmin && (
                            <button
                                onClick={() => setActiveModal('costs')}
                                className="group relative bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                <span className="text-2xl">💰</span>
                                <span className="relative z-10">Custos</span>
                            </button>
                        )}
                        <button
                            onClick={signOut}
                            className="group relative bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <span className="text-2xl">🚪</span>
                            <span className="relative z-10">Sair</span>
                        </button>
                    </div>
                </header>

                <MealPlanner onCalculate={handleCalculate} isLoading={isLoading} />

                {error && (
                     <div className="mt-8 max-w-2xl mx-auto bg-red-900/50 border border-error text-error p-4 rounded-lg text-center animate-fade-in">
                        <p className="font-semibold">Oops! Algo deu errado.</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </main>

             <footer className="text-center mt-12 text-text-muted text-sm">
                <p>Powered by Gemini API & Supabase. Designed with passion.</p>
            </footer>

            {/* Modals */}
            {activeModal === 'profile' && <ProfileModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'health' && <HealthModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'costs' && <CostAnalysisModal isOpen={true} onClose={() => setActiveModal(null)} />}
            {activeModal === 'history' && <HistoryModal onClose={() => setActiveModal(null)} />}

            {/* Modal de Resultado de Refeição */}
            {mealResult && !isLoading && (
                <MealResultDisplay
                    result={mealResult}
                    mealType={currentMealType}
                    onSaveSuccess={() => setMealResult(null)}
                    onClose={() => setMealResult(null)}
                />
            )}
        </div>
        </>
    );
};

export default App;
