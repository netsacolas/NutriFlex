
import React, { useState, useCallback } from 'react';
import { MealPlanner } from './components/MealPlanner';
import { MealResultDisplay } from './components/MealResult';
import { AuthFlow } from './components/Auth/AuthFlow';
import { ProfileModal } from './components/UserPanel/ProfileModal';
import { HealthModal } from './components/UserPanel/HealthModal';
import { HistoryModal } from './components/UserPanel/HistoryModal';
import CostAnalysisModal from './components/UserPanel/CostAnalysisModal';
import { calculateMealPortions } from './services/geminiService';
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
        <div className="min-h-screen bg-primary-bg text-text-primary font-sans p-4 md:p-8">
            <main className="max-w-7xl mx-auto">
                <header className="text-center mb-8 md:mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex-1"></div>
                        <div className="flex-1 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-orange to-accent-coral text-transparent bg-clip-text pb-2">
                                NutriFlex AI
                            </h1>
                        </div>
                        <div className="flex-1 flex justify-end gap-3">
                            <button
                                onClick={() => setActiveModal('profile')}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <span>👤</span>
                                <span className="hidden md:inline">Perfil</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('health')}
                                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <span>💪</span>
                                <span className="hidden md:inline">Saúde</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('history')}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <span>📊</span>
                                <span className="hidden md:inline">Histórico</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('costs')}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <span>💰</span>
                                <span className="hidden md:inline">Custos</span>
                            </button>
                            <button
                                onClick={signOut}
                                className="bg-secondary-bg text-text-secondary hover:text-error hover:border-error px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border-color"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        A dieta que se adapta a você. Escolha os alimentos, defina sua meta de calorias e a IA calcula as porções perfeitas.
                    </p>
                </header>

                <MealPlanner onCalculate={handleCalculate} isLoading={isLoading} />

                {error && (
                     <div className="mt-8 max-w-2xl mx-auto bg-red-900/50 border border-error text-error p-4 rounded-lg text-center animate-fade-in">
                        <p className="font-semibold">Oops! Algo deu errado.</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {mealResult && !isLoading && (
                    <MealResultDisplay
                        result={mealResult}
                        mealType={currentMealType}
                        onSaveSuccess={() => setMealResult(null)}
                    />
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
        </div>
    );
};

export default App;
