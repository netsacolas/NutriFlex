
import React, { useState, useCallback } from 'react';
import { MealPlanner } from './components/MealPlanner';
import { MealResultDisplay } from './components/MealResult';
import { AuthFlow } from './components/Auth/AuthFlow';
import { UserPanel } from './components/UserPanel/UserPanel';
import { calculateMealPortions } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import type { MealResult, MealType } from './types';

const App: React.FC = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [mealResult, setMealResult] = useState<MealResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUserPanel, setShowUserPanel] = useState(false);

    const handleCalculate = useCallback(async (foods: string[], targetCalories: number, mealType: MealType) => {
        setIsLoading(true);
        setError(null);
        setMealResult(null);

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
                        <div className="flex-1 flex justify-end gap-4">
                            <button
                                onClick={() => setShowUserPanel(true)}
                                className="text-accent-orange hover:text-accent-coral text-sm font-medium transition-colors"
                            >
                                Meu Perfil
                            </button>
                            <button
                                onClick={signOut}
                                className="text-text-secondary hover:text-text-bright text-sm font-medium transition-colors"
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
                    <MealResultDisplay result={mealResult} />
                )}
            </main>

             <footer className="text-center mt-12 text-text-muted text-sm">
                <p>Powered by Gemini API & Supabase. Designed with passion.</p>
            </footer>

            {showUserPanel && <UserPanel onClose={() => setShowUserPanel(false)} />}
        </div>
    );
};

export default App;
