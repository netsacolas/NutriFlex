
import React, { useState, useCallback } from 'react';
import { MealPlanner } from './components/MealPlanner';
import { MealResultDisplay } from './components/MealResult';
import { calculateMealPortions } from './services/geminiService';
import type { MealResult, MealType } from './types';

const App: React.FC = () => {
    const [mealResult, setMealResult] = useState<MealResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="min-h-screen bg-primary-bg text-text-primary font-sans p-4 md:p-8">
            <main className="max-w-7xl mx-auto">
                <header className="text-center mb-8 md:mb-12">
                     <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-orange to-accent-coral text-transparent bg-clip-text pb-2">
                        NutriFlex AI
                    </h1>
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
                <p>Powered by Gemini API. Designed with passion.</p>
            </footer>
        </div>
    );
};

export default App;
