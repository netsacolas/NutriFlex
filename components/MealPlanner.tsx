import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MealType, UserProfile } from '../types';
import {
    PizzaIcon,
    TargetIcon,
    XIcon,
    ZapIcon,
    LoaderIcon,
    StarIcon,
    SunriseIcon,
    PlateIcon,
    MoonIcon,
    CookieIcon
} from './icons';
import { searchFoods } from '../data/foodDatabase';
import { profileService } from '../services/profileService';
import logger from '../utils/logger';

interface MealPlannerProps {
    onCalculate: (foods: string[], targetCalories: number, mealType: MealType) => void;
    isLoading: boolean;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ onCalculate, isLoading }) => {
    const { user } = useAuth();
    const [mealType, setMealType] = useState<MealType>('lunch');
    const [targetCalories, setTargetCalories] = useState(600);
    const [currentFood, setCurrentFood] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<string[]>(['Arroz branco', 'Feijão preto']);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [favoriteNotification, setFavoriteNotification] = useState<string | null>(null);

    // Usar chave única por usuário para favoritos
    const getFavoritesKey = () => {
        return user?.id ? `favoriteFoods_${user.id}` : 'favoriteFoods_anonymous';
    };

    const [favoriteFoods, setFavoriteFoods] = useState<string[]>(() => {
        try {
            const key = getFavoritesKey();
            const savedFavorites = localStorage.getItem(key);
            logger.debug(`Loading favorites from key: ${key}`, savedFavorites);
            return savedFavorites ? JSON.parse(savedFavorites) : [];
        } catch (error) {
            logger.error("Failed to parse favorite foods from localStorage", error);
            return [];
        }
    });

    // Salvar favoritos quando mudarem
    useEffect(() => {
        try {
            const key = getFavoritesKey();
            localStorage.setItem(key, JSON.stringify(favoriteFoods));
            logger.debug(`Saved favorites to key: ${key}`, favoriteFoods);
        } catch (error) {
            logger.error("Failed to save favorite foods to localStorage", error);
        }
    }, [favoriteFoods, user?.id]);

    // Recarregar favoritos quando o usuário mudar
    useEffect(() => {
        try {
            const key = getFavoritesKey();
            const savedFavorites = localStorage.getItem(key);
            if (savedFavorites) {
                setFavoriteFoods(JSON.parse(savedFavorites));
                logger.debug(`Reloaded favorites for user change: ${key}`);
            }
        } catch (error) {
            logger.error("Failed to reload favorites on user change", error);
        }
    }, [user?.id]);

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
        setFavoriteFoods(prevFavorites => {
            const isRemoving = prevFavorites.includes(foodToToggle);
            const newFavorites = isRemoving
                ? prevFavorites.filter(f => f !== foodToToggle)
                : [...prevFavorites, foodToToggle];

            // Log para depuração
            logger.debug(`${isRemoving ? 'Removed from' : 'Added to'} favorites: ${foodToToggle}`);
            logger.debug('Current favorites:', newFavorites);

            return newFavorites;
        });
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
        breakfast: {
            icon: SunriseIcon,
            label: 'Café da Manhã',
            color: 'from-green-500 to-emerald-400'
        },
        lunch: {
            icon: PlateIcon,
            label: 'Almoço',
            color: 'from-emerald-500 to-green-400'
        },
        dinner: {
            icon: MoonIcon,
            label: 'Jantar',
            color: 'from-teal-500 to-green-500'
        },
        snack: {
            icon: CookieIcon,
            label: 'Lanche',
            color: 'from-lime-500 to-green-400'
        },
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
                                        ? 'border-green-500 shadow-lg shadow-green-500/30'
                                        : 'border-border-color hover:border-green-500/50'
                                }`}
                            >
                                {/* Background gradient when active */}
                                {isActive && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10`}></div>
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <config.icon className={`w-8 h-8 ${
                                        isActive ? 'text-green-500' : 'text-text-secondary'
                                    }`} />
                                    <span className={`text-sm font-semibold ${
                                        isActive ? 'text-green-500' : 'text-text-secondary'
                                    }`}>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
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
                        <TargetIcon className="w-6 h-6 text-green-500" />
                        Meta de Calorias (kcal)
                    </label>
                    <input
                        type="number"
                        id="calories"
                        value={targetCalories}
                        onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-secondary-bg text-text-bright text-xl p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-green-500 focus:outline-none transition-shadow"
                        placeholder="Ex: 600"
                    />
                </div>

                <div className="relative">
                    <label htmlFor="food-input" className="flex items-center gap-2 text-lg font-medium text-text-primary mb-2">
                        <PizzaIcon className="w-6 h-6 text-green-500" />
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
                                className="w-full bg-secondary-bg text-text-bright p-3 rounded-lg border border-border-color focus:ring-2 focus:ring-green-500 focus:outline-none transition-shadow"
                                placeholder="Digite um alimento (ex: ovo, frango, arroz...)"
                                autoComplete="off"
                            />

                            {/* Dropdown de Sugestões */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-2 bg-secondary-bg border-2 border-green-500/50 rounded-lg shadow-2xl shadow-green-500/20 max-h-64 overflow-y-auto animate-slide-up"
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleAddFood(suggestion)}
                                            className={`px-4 py-3 cursor-pointer transition-all ${
                                                index === selectedSuggestionIndex
                                                    ? 'bg-green-500 text-white font-semibold'
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
                         <button type="submit" className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
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
                                <button
                                    onClick={() => toggleFavorite(food)}
                                    className={`transition-all duration-200 ${favoriteFoods.includes(food) ? 'text-yellow-400 transform scale-110' : 'text-text-muted hover:text-yellow-400'}`}
                                    title={favoriteFoods.includes(food) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                >
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
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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