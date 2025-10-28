import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MealResult, Portion, MealType } from '../types';
import { LightbulbIcon, CheckCircleIcon, BarChartIcon } from './icons';
import { SaveMealModal } from './SaveMealModal';

interface MealResultProps {
  result: MealResult;
  mealType: MealType;
  onSaveSuccess?: () => void;
  onClose: () => void;
}

const MacroChart: React.FC<{ data: MealResult['totalMacros'], totalCalories: number }> = ({ data, totalCalories }) => {
  const chartData = useMemo(() => [
    { name: 'Carboidratos', value: data.carbs * 4, grams: data.carbs, color: '#fb923c', darkColor: '#f97316' }, // Laranja vibrante
    { name: 'Proteínas', value: data.protein * 4, grams: data.protein, color: '#10b981', darkColor: '#059669' }, // Verde forte
    { name: 'Gorduras', value: data.fat * 9, grams: data.fat, color: '#fbbf24', darkColor: '#f59e0b' }, // Amarelo-laranja
  ], [data.carbs, data.protein, data.fat]);

  // Calcular porcentagens
  const percentages = useMemo(() => chartData.map(entry => ({
    ...entry,
    percentage: Math.round((entry.value / totalCalories) * 100)
  })), [chartData, totalCalories]);

  return (
    <div className="w-full space-y-4">
      <div className="w-full h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                  backgroundColor: '#2d2d30',
                  border: '1px solid #464647',
                  borderRadius: '0.5rem'
              }}
              formatter={(value: number, name: string) => [`${Math.round(value)} kcal`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-text-bright transition-all">{totalCalories}</span>
          <span className="text-sm text-text-secondary">kcal</span>
        </div>
      </div>

      {/* Legendas com porcentagens */}
      <div className="space-y-2 px-2">
        {percentages.map((entry, index) => (
          <div key={index} className="flex items-center justify-between bg-secondary-bg/50 rounded-lg p-3 border border-border-color hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 8px ${entry.color}`
                }}
              />
              <span className="text-text-primary font-medium">{entry.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-400 font-bold text-lg">{entry.percentage}%</span>
              <span className="text-text-secondary text-sm">
                {Math.round(entry.grams)}g • {Math.round(entry.value)} kcal
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MealResultDisplay: React.FC<MealResultProps> = ({ result, mealType, onSaveSuccess, onClose }) => {
    const [editedResult, setEditedResult] = useState<MealResult>(result);
    const [inputValues, setInputValues] = useState<Map<string, string>>(new Map());
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const originalPortionsMap = useMemo(() => {
        const map = new Map<string, Portion>();
        result.portions.forEach(p => map.set(p.foodName, p));
        return map;
    }, [result]);

    useEffect(() => {
        setEditedResult(result);
        // Inicializar valores dos inputs
        const newInputValues = new Map<string, string>();
        result.portions.forEach(p => {
            newInputValues.set(p.foodName, p.grams.toString());
        });
        setInputValues(newInputValues);
    }, [result]);

    const handleGramsChange = (foodName: string, newGramsStr: string) => {
        // Atualizar o valor do input imediatamente (permitindo vazio)
        setInputValues(prev => {
            const newMap = new Map(prev);
            newMap.set(foodName, newGramsStr);
            return newMap;
        });

        // Se estiver vazio, não calcular ainda
        if (newGramsStr === '') {
            return;
        }

        // Validar input
        const newGrams = parseInt(newGramsStr, 10);

        // Se for inválido, não fazer nada
        if (isNaN(newGrams)) {
            return;
        }

        // Permitir 0 para "remover" o alimento temporariamente
        const originalPortion = originalPortionsMap.get(foodName);
        if (!originalPortion || originalPortion.grams === 0) return;

        setEditedResult(prevResult => {
            // Atualizar APENAS o alimento modificado, mantendo os outros como estão
            const updatedPortions = prevResult.portions.map(portion => {
                if (portion.foodName !== foodName) {
                    // Não é o alimento sendo editado, retornar sem mudanças
                    return portion;
                }

                // É o alimento sendo editado - calcular do ORIGINAL
                if (newGrams === 0) {
                    return {
                        ...portion,
                        grams: 0,
                        homeMeasure: 'Personalizado',
                        calories: 0,
                        macros: {
                            protein: 0,
                            carbs: 0,
                            fat: 0,
                            fiber: 0,
                        },
                        glycemicIndex: originalPortion.glycemicIndex
                    };
                }

                // Calcular proporção baseado no ORIGINAL
                const ratio = newGrams / originalPortion.grams;

                return {
                    ...portion,
                    grams: newGrams,
                    homeMeasure: newGrams === originalPortion.grams ? originalPortion.homeMeasure : 'Personalizado',
                    calories: Math.round(originalPortion.calories * ratio),
                    macros: {
                        protein: parseFloat((originalPortion.macros.protein * ratio).toFixed(1)),
                        carbs: parseFloat((originalPortion.macros.carbs * ratio).toFixed(1)),
                        fat: parseFloat((originalPortion.macros.fat * ratio).toFixed(1)),
                        fiber: originalPortion.macros.fiber ? parseFloat((originalPortion.macros.fiber * ratio).toFixed(1)) : 0,
                    },
                    glycemicIndex: originalPortion.glycemicIndex
                };
            });

            // Recalculate totals (ignorando alimentos com 0g)
            const newTotalMacros = updatedPortions.reduce((acc, p) => {
                if (p.grams > 0) {
                    acc.protein += p.macros.protein;
                    acc.carbs += p.macros.carbs;
                    acc.fat += p.macros.fat;
                    acc.fiber += p.macros.fiber || 0;
                }
                return acc;
            }, { protein: 0, carbs: 0, fat: 0, fiber: 0 });

            const newTotalCalories = updatedPortions.reduce((acc, p) => {
                if (p.grams > 0) {
                    acc += p.calories;
                }
                return acc;
            }, 0);

            // Recalculate weighted average glycemic index (apenas com porções > 0)
            const portionsWithCarbs = updatedPortions.filter(p => p.grams > 0 && p.macros.carbs > 0);
            const totalCarbs = portionsWithCarbs.reduce((sum, p) => sum + p.macros.carbs, 0);

            const weightedGI = totalCarbs > 0
                ? portionsWithCarbs.reduce((sum, p) => {
                    const weight = p.macros.carbs / totalCarbs;
                    return sum + ((p.glycemicIndex || 0) * weight);
                }, 0)
                : 0;

            // Recalculate glycemic load: (GI * carbs) / 100
            const newGlycemicLoad = totalCarbs > 0 ? (weightedGI * totalCarbs) / 100 : 0;

            return {
                ...prevResult,
                portions: updatedPortions,
                totalCalories: newTotalCalories,
                totalMacros: {
                    protein: parseFloat(newTotalMacros.protein.toFixed(1)),
                    carbs: parseFloat(newTotalMacros.carbs.toFixed(1)),
                    fat: parseFloat(newTotalMacros.fat.toFixed(1)),
                    fiber: parseFloat(newTotalMacros.fiber.toFixed(1)),
                },
                glycemicData: {
                    index: Math.round(weightedGI),
                    load: parseFloat(newGlycemicLoad.toFixed(1)),
                },
            };
        });
    };
    
  return (
    <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Modal Container */}
            <div className="bg-card-bg rounded-xl w-full max-w-6xl my-8 border border-border-color shadow-2xl animate-slide-up">
                {/* Header com X */}
                <div className="sticky top-0 bg-gradient-to-r from-accent-orange to-accent-coral p-6 rounded-t-xl flex justify-between items-center z-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        ✨ Suas Porções Calculadas
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                        aria-label="Fechar modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 max-h-[calc(100vh-200px)] overflow-y-auto">

                    {saveSuccess && (
                        <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-4 animate-fade-in">
                            ✅ Refeição salva no histórico com sucesso!
                        </div>
                    )}

                    {/* Título chamativo para as porções */}
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                            🍽️ Seu Plano Alimentar Personalizado
                        </h2>
                        <p className="text-lg text-gray-400">
                            Confira os alimentos e quantidades que você deve consumir
                        </p>
                    </div>

                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="bg-success text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            💾 Salvar como Consumo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4 order-1">
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-4 rounded-xl border-2 border-emerald-500/30 mb-4">
                    <h3 className="text-2xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
                        📋 Alimentos e Quantidades
                    </h3>
                    <p className="text-sm text-gray-400">
                        Estas são as porções calculadas para sua refeição. Você pode ajustar as quantidades conforme sua preferência.
                    </p>
                </div>
                {editedResult.portions.map(item => (
                    <div key={item.foodName} className="bg-secondary-bg p-4 rounded-lg border border-border-color transition-all duration-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-lg font-bold text-text-bright">{item.foodName}</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={inputValues.get(item.foodName) || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Permitir vazio ou apenas números
                                            if (value === '' || /^\d+$/.test(value)) {
                                                handleGramsChange(item.foodName, value);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Se vazio ao perder foco, restaurar valor atual da porção
                                            if (e.target.value === '' || e.target.value === null) {
                                                setInputValues(prev => {
                                                    const newMap = new Map(prev);
                                                    newMap.set(item.foodName, item.grams.toString());
                                                    return newMap;
                                                });
                                            }
                                        }}
                                        className="w-24 bg-hover-bg text-accent-coral font-semibold text-lg p-1 rounded border border-border-color focus:ring-1 focus:ring-accent-orange focus:outline-none"
                                        aria-label={`Grams for ${item.foodName}`}
                                    />
                                    <span className="text-accent-coral font-semibold text-lg">g</span>
                                </div>
                                <p className="text-text-secondary text-sm mt-1">({item.homeMeasure})</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-text-primary">{item.calories} kcal</p>
                                <p className="text-xs text-text-muted">
                                    P:{item.macros.protein}g C:{item.macros.carbs}g G:{item.macros.fat}g
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-2 space-y-6 order-2">
                <div>
                   <h3 className="flex items-center gap-2 text-xl font-semibold text-text-primary mb-2">
                       <BarChartIcon className="w-6 h-6 text-accent-peach" />
                       Análise Nutricional
                   </h3>
                   <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                      <MacroChart
                        key={`${editedResult.totalCalories}-${editedResult.totalMacros.protein}-${editedResult.totalMacros.carbs}-${editedResult.totalMacros.fat}`}
                        data={editedResult.totalMacros}
                        totalCalories={editedResult.totalCalories}
                      />
                      <div className="grid grid-cols-3 gap-2 text-center mt-4">
                          <div><span className="font-bold text-protein">{Math.round(editedResult.totalMacros.protein)}g</span><p className="text-xs text-text-muted">Proteína</p></div>
                          <div><span className="font-bold text-carbs">{Math.round(editedResult.totalMacros.carbs)}g</span><p className="text-xs text-text-muted">Carbs</p></div>
                          <div><span className="font-bold text-fat">{Math.round(editedResult.totalMacros.fat)}g</span><p className="text-xs text-text-muted">Gordura</p></div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-bg p-3 rounded-lg text-center border border-border-color">
                        <p className="text-xs text-text-secondary">Fibras</p>
                        <p className="text-xl font-bold text-fiber">{Math.round(editedResult.totalMacros.fiber)}g</p>
                    </div>
                     <div className="bg-secondary-bg p-3 rounded-lg text-center border border-border-color">
                        <p className="text-xs text-text-secondary">Índice Glicêmico</p>
                        <p className="text-xl font-bold text-warning">{editedResult.glycemicData.index}</p>
                    </div>
                    <div className="bg-secondary-bg p-3 rounded-lg text-center border border-border-color col-span-2">
                        <p className="text-xs text-text-secondary">Carga Glicêmica</p>
                        <p className="text-xl font-bold text-info">{editedResult.glycemicData.load}</p>
                    </div>
                </div>
            </div>
        </div>

                    {editedResult.suggestions && editedResult.suggestions.length > 0 && (
                        <div className="mt-8">
                            <h3 className="flex items-center gap-2 text-xl font-semibold text-text-primary mb-3">
                               <LightbulbIcon className="w-6 h-6 text-accent-peach" />
                               Sugestões
                            </h3>
                            <div className="bg-secondary-bg p-4 rounded-lg border border-border-color space-y-2">
                                {editedResult.suggestions.map((tip, index) => (
                                    <div key={index} className="flex items-start gap-2 text-text-secondary">
                                       <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                       <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Modal de Salvamento */}
        {showSaveModal && (
            <SaveMealModal
                mealResult={editedResult}
                mealType={mealType}
                onClose={() => setShowSaveModal(false)}
                onSuccess={() => {
                    setSaveSuccess(true);
                    setTimeout(() => {
                        setSaveSuccess(false);
                        if (onSaveSuccess) {
                            onSaveSuccess();
                        }
                    }, 2000);
                }}
            />
        )}
    </>
  );
};
