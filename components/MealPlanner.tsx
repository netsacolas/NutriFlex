import React, { useState, useEffect, useRef } from 'react';
import type { MealType, UserProfile } from '../types';
import { PizzaIcon, TargetIcon, XIcon, ZapIcon, LoaderIcon, StarIcon } from './icons';
import { searchFoods } from '../data/foodDatabase';
import { profileService } from '../services/profileService';
import logger from '../utils/logger';

interface MealPlannerProps {
    onCalculate: (foods: string[], targetCalories: number, mealType: MealType) => void;
    isLoading: boolean;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ onCalculate, isLoading }) => {
    const [mealType, setMealType] = useState<MealType>('lunch');
    const [targetCalories, setTargetCalories] = useState(600);
    const [currentFood, setCurrentFood] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<string[]>(['Arroz branco', 'Feijão preto', 'Frango grelhado', 'Brócolis']);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [favoriteFoods, setFavoriteFoods] = useState<string[]>(() => {
        try {
            const savedFavorites = localStorage.getItem('favoriteFoods');
            return savedFavorites ? JSON.parse(savedFavorites) : [];
        } catch (error) {
            logger.error("Failed to parse favorite foods from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
    }, [favoriteFoods]);

    // Carregar perfil do usuário ao montar o componente
    useEffect(() => {
        const loadProfile = async () => {
            logger.debug('Loading user profile');
            const { data, error } = await profileService.getProfile();
            if (data) {
                logger.debug('User profile loaded successfully');
                setProfile(data);
            } else if (error) {
                logger.error('Failed to load user profile', error);
            }
        };
        loadProfile();
    }, []);

    // Atualizar targetCalories quando mealType ou profile mudar
    useEffect(() => {
        if (profile) {
            const calorieMap = {
                breakfast: profile.breakfast_calories || 400,
                lunch: profile.lunch_calories || 600,
                dinner: profile.dinner_calories || 600,
                snack: profile.snack_calories || 200,
            };
            const newCalories = calorieMap[mealType];
            logger.debug(`Updating calories for ${mealType}: ${newCalories}`);
            setTargetCalories(newCalories);
        } else {
            logger.debug('Profile not loaded yet, using default values');
        }
    }, [mealType, profile]);

    // Autocomplete: atualizar sugestões quando o usuário digita
    useEffect(() => {
        if (currentFood.trim().length > 0) {
            const results = searchFoods(currentFood, 8);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setSelectedSuggestionIndex(-1);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [currentFood]);

    // Fechar sugestões ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddFood = (foodToAdd?: string) => {
        const trimmedFood = (foodToAdd || currentFood).trim();
        if (trimmedFood && !selectedFoods.find(f => f.toLowerCase() === trimmedFood.toLowerCase())) {
            setSelectedFoods([...selectedFoods, trimmedFood]);
            setCurrentFood('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAddFood();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    handleAddFood(suggestions[selectedSuggestionIndex]);
                } else {
                    handleAddFood();
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
        }
    };

    const removeFood = (foodToRemove: string) => {
        setSelectedFoods(selectedFoods.filter(food => food !== foodToRemove));
    };

    const toggleFavorite = (foodToToggle: string) => {
        setFavoriteFoods(prevFavorites =>
            prevFavorites.includes(foodToToggle)
                ? prevFavorites.filter(f => f !== foodToToggle)
                : [...prevFavorites, foodToToggle]
        );
    };

    const addFavoriteToMeal = (foodToAdd: string) => {
        if (!selectedFoods.includes(foodToAdd)) {
            setSelectedFoods(prevSelected => [...prevSelected, foodToAdd]);
        }
    };
    
    const handleCalculateClick = () => {
        if (selectedFoods.length > 0 && targetCalories > 0) {
            onCalculate(selectedFoods, targetCalories, mealType);
        }
    };

    const mealTypeConfig = {
        breakfast: { icon: '☀️', label: 'Café da Manhã', color: 'from-yellow-500 to-orange-400' },
        lunch: { icon: '🍽️', label: 'Almoço', color: 'from-orange-500 to-red-400' },
        dinner: { icon: '🌙', label: 'Jantar', color: 'from-purple-500 to-indigo-500' },
        snack: { icon: '🍪', label: 'Lanche', color: 'from-green-500 to-teal-400' },
    };

    return (
        <div className="bg-card-bg rounded-xl p-6 md:p-8 w-full max-w-2xl mx-auto border border-border-color shadow-lg">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-text-bright mb-4 text-center">
                    Planejador de Refeição
                </h2>

                {/* Meal Type Selector - Modern Design */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(mealTypeConfig) as MealType[]).map((type) => {
                        const config = mealTypeConfig[type];
                        const isActive = mealType === type;

                        return (
                            <button
                                key={type}
                                onClick={() => setMealType(type)}
                                className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                                    isActive
                                        ? 'border-accent-orange shadow-lg shadow-accent-orange/30'
                                        : 'border-border-color hover:border-accent-orange/50'
                                }`}
                            >
                                {/* Background gradient when active */}
                                {isActive && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10`}></div>
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <span className="text-3xl">{config.icon}</span>
                                    <span className={`text-sm font-semibold ${
                                        isActive ? 'text-accent-orange' : 'text-text-secondary'
                                    }`}>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-3 h-3 bg-accent-orange rounded-full animate-pulse"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="calories" className="flex items-center gap-2 text-lg font-medium text-text-primary mb-2">
                        <TargetIcon className="w-6 h-6 text-accent-coral" />
                        Meta de Calorias (kcal)
                    </label>
                    <input
                        type="number"
                        id="calories"
                        value={targetCalories}
                        onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-secondary-bg text-text-bright text-xl p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-shadow"
                        placeholder="Ex: 600"
                    />
                </div>

                <div className="relative">
                    <label htmlFor="food-input" className="flex items-center gap-2 text-lg font-medium text-text-primary mb-2">
                        <PizzaIcon className="w-6 h-6 text-accent-coral" />
                        O que você vai comer?
                    </label>
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-grow relative">
                            <input
                                ref={inputRef}
                                type="text"
                                id="food-input"
                                value={currentFood}
                                onChange={(e) => setCurrentFood(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => currentFood.trim() && setShowSuggestions(suggestions.length > 0)}
                                className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none transition-shadow"
                                placeholder="Digite um alimento (ex: ovo, frango, arroz...)"
                                autoComplete="off"
                            />

                            {/* Dropdown de Sugestões */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-2 bg-secondary-bg border-2 border-accent-orange/50 rounded-lg shadow-2xl shadow-accent-orange/20 max-h-64 overflow-y-auto animate-slide-up"
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleAddFood(suggestion)}
                                            className={`px-4 py-3 cursor-pointer transition-all ${
                                                index === selectedSuggestionIndex
                                                    ? 'bg-accent-orange text-white font-semibold'
                                                    : 'hover:bg-hover-bg text-text-primary'
                                            } ${index !== suggestions.length - 1 ? 'border-b border-border-color' : ''}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <PizzaIcon className="w-4 h-4" />
                                                {suggestion}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                         <button type="submit" className="bg-accent-orange text-text-bright font-bold px-4 py-2 rounded-lg hover:bg-accent-coral transition-colors">
                            Adicionar
                        </button>
                    </form>
                    {currentFood.trim() && suggestions.length === 0 && (
                        <p className="text-text-muted text-sm mt-2">Nenhum alimento encontrado. Digite outro nome ou adicione manualmente.</p>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-text-secondary">Alimentos Selecionados:</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedFoods.length === 0 && <p className="text-text-muted text-sm">Nenhum alimento adicionado ainda.</p>}
                        {selectedFoods.map((food) => (
                            <div key={food} className="flex items-center gap-2 bg-secondary-bg text-text-primary px-3 py-1.5 rounded-full animate-fade-in">
                                <span>{food}</span>
                                <button onClick={() => toggleFavorite(food)} className="text-text-muted hover:text-yellow-400 transition-colors" title="Adicionar aos favoritos">
                                    <StarIcon filled={favoriteFoods.includes(food)} className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeFood(food)} className="text-text-muted hover:text-error transition-colors" title="Remover alimento">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {favoriteFoods.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h3 className="text-text-secondary">Favoritos:</h3>
                        <div className="flex flex-wrap gap-2">
                            {favoriteFoods.map(food => (
                                <button
                                    key={food}
                                    onClick={() => addFavoriteToMeal(food)}
                                    className="bg-secondary-bg text-text-primary px-3 py-1.5 rounded-full hover:bg-hover-bg transition-colors animate-fade-in"
                                    title={`Adicionar ${food} à refeição`}
                                >
                                    {food}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <button
                    onClick={handleCalculateClick}
                    disabled={isLoading || selectedFoods.length === 0}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-primary text-white text-lg font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-accent-orange/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                    {isLoading ? (
                        <>
                          <LoaderIcon className="w-6 h-6 animate-spin" />
                          Calculando...
                        </>
                    ) : (
                        <>
                           <ZapIcon className="w-6 h-6"/>
                           Calcular Porções Ideais
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};