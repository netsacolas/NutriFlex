
import { GoogleGenAI, Type } from '@google/genai';
import { MealResult, MealType } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY environment variable not set. Using a placeholder. Please set your API key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'YOUR_API_KEY_HERE' });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        totalCalories: { type: Type.NUMBER, description: "Total calculated calories for the meal, should be very close to the target." },
        totalMacros: {
            type: Type.OBJECT,
            properties: {
                protein: { type: Type.NUMBER, description: "Total protein in grams." },
                carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams." },
                fat: { type: Type.NUMBER, description: "Total fat in grams." },
                fiber: { type: Type.NUMBER, description: "Total fiber in grams." },
            },
            required: ["protein", "carbs", "fat", "fiber"],
        },
        glycemicData: {
            type: Type.OBJECT,
            properties: {
                index: { type: Type.NUMBER, description: "Average Glycemic Index of the meal." },
                load: { type: Type.NUMBER, description: "Total Glycemic Load of the meal." },
            },
            required: ["index", "load"],
        },
        portions: {
            type: Type.ARRAY,
            description: "List of each food with its calculated portion size and nutritional info.",
            items: {
                type: Type.OBJECT,
                properties: {
                    foodName: { type: Type.STRING, description: "Name of the food item." },
                    grams: { type: Type.NUMBER, description: "Calculated portion size in grams." },
                    homeMeasure: { type: Type.STRING, description: "A common household measure, e.g., '1 scoop', '2 small filets', '1 cup'." },
                    calories: { type: Type.NUMBER, description: "Calories for this portion." },
                    macros: {
                        type: Type.OBJECT,
                        properties: {
                            protein: { type: Type.NUMBER, description: "Protein in grams for this portion." },
                            carbs: { type: Type.NUMBER, description: "Carbohydrates in grams for this portion." },
                            fat: { type: Type.NUMBER, description: "Fat in grams for this portion." },
                            fiber: { type: Type.NUMBER, description: "Fiber in grams for this portion." },
                        },
                         required: ["protein", "carbs", "fat", "fiber"],
                    },
                    glycemicIndex: { type: Type.NUMBER, description: "Glycemic index of this specific food item." },
                },
                required: ["foodName", "grams", "homeMeasure", "calories", "macros", "glycemicIndex"],
            },
        },
        suggestions: {
            type: Type.ARRAY,
            description: "A few helpful tips or suggestions to improve the meal's nutritional quality.",
            items: { type: Type.STRING },
        },
    },
    required: ["totalCalories", "totalMacros", "glycemicData", "portions", "suggestions"],
};


export const calculateMealPortions = async (
    foods: string[],
    targetCalories: number,
    mealType: MealType
): Promise<MealResult> => {
    try {
        const mealTypeTranslation = {
            breakfast: 'café da manhã',
            lunch: 'almoço',
            dinner: 'jantar',
            snack: 'lanche'
        };

        // Calcular metas de macros para 40% carboidratos, 30% proteína, 30% gordura
        const targetProteinGrams = Math.round((targetCalories * 0.30) / 4); // 30% das calorias ÷ 4 kcal/g
        const targetCarbsGrams = Math.round((targetCalories * 0.40) / 4);   // 40% das calorias ÷ 4 kcal/g
        const targetFatGrams = Math.round((targetCalories * 0.30) / 9);     // 30% das calorias ÷ 9 kcal/g

        const prompt = `Calcule um plano de refeição PERFEITAMENTE BALANCEADO para ${mealTypeTranslation[mealType]} com uma meta de ${targetCalories} calorias usando os seguintes alimentos: ${foods.join(', ')}.

REGRA FUNDAMENTAL - DISTRIBUIÇÃO 40/30/30:
Ajuste as PORÇÕES (em gramas) de cada alimento para que a SOMA DOS MACROS de todas as porções atinja:
- CARBOIDRATOS TOTAIS: ${targetCarbsGrams}g (isso gerará ${targetCarbsGrams * 4} kcal = 40% do total)
- PROTEÍNA TOTAL: ${targetProteinGrams}g (isso gerará ${targetProteinGrams * 4} kcal = 30% do total)
- GORDURA TOTAL: ${targetFatGrams}g (isso gerará ${targetFatGrams * 9} kcal = 30% do total)

PROCESSO DE CÁLCULO:
1. Analise a composição nutricional de cada alimento (proteína, carboidrato e gordura por 100g)
2. Ajuste a PORÇÃO (gramas) de cada alimento de forma iterativa
3. SOME os macros de todas as porções
4. Verifique se a soma total está próxima das metas acima (${targetProteinGrams}g proteína, ${targetCarbsGrams}g carboidratos, ${targetFatGrams}g gordura)
5. Se não estiver, AJUSTE as porções novamente até atingir as metas

IMPORTANTE: A soma dos macros de TODAS as porções DEVE resultar nas metas acima. Não basta distribuir individualmente, a SOMA TOTAL deve ser 40% carboidratos, 30% proteína e 30% gordura.

ANÁLISE NUTRICIONAL COMPLETA:
Forneça quantidades precisas em gramas, medidas caseiras comuns (em português brasileiro), e uma análise nutricional detalhada incluindo:
- Calorias totais (o mais próximo possível de ${targetCalories} kcal)
- Macros totais (proteína, carboidratos, gordura, fibras em gramas)
- Índice glicêmico médio da refeição
- Carga glicêmica total da refeição
- Porções detalhadas de cada alimento com suas calorias, macros individuais e índice glicêmico

SUGESTÕES PERSONALIZADAS:
Analise os alimentos específicos escolhidos pelo usuário (${foods.join(', ')}) e forneça de 3 a 5 sugestões PERSONALIZADAS que incluam:
1. Substituições inteligentes para tornar a refeição menos calórica mantendo saciedade
2. Combinações saudáveis que potencializam nutrientes
3. Opções de vegetais ou temperos que podem ser adicionados sem impacto calórico significativo
4. Alternativas de preparo mais saudáveis (ex: grelhado ao invés de frito)
5. Sugestões específicas baseadas no tipo de refeição (${mealTypeTranslation[mealType]})

As sugestões devem ser práticas, específicas para os alimentos escolhidos, e focadas em melhorar qualidade nutricional.`;


        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                systemInstruction: "Você é o NutriFlex AI, um nutricionista especialista. Sua tarefa é calcular os tamanhos precisos das PORÇÕES (em gramas) para uma lista de alimentos específica, de forma que a SOMA TOTAL dos macronutrientes resulte em uma distribuição equilibrada: 40% carboidratos, 30% proteína e 30% gordura.\n\nREGRA MAIS IMPORTANTE - SOMA DAS PORÇÕES = 40/30/30:\nVocê receberá metas de macronutrientes totais. Ajuste as PORÇÕES (gramas) de cada alimento para que:\n- SOMA dos carboidratos de TODAS as porções = meta de carboidratos informada (40% das calorias)\n- SOMA das proteínas de TODAS as porções = meta de proteína informada (30% das calorias)\n- SOMA das gorduras de TODAS as porções = meta de gordura informada (30% das calorias)\n\nPROCESSO OBRIGATÓRIO:\n1. Para cada alimento, conheça sua composição nutricional por 100g\n2. Calcule quanto de cada macro cada alimento contribuirá baseado na porção\n3. Ajuste as porções iterativamente até que a SOMA TOTAL se aproxime das metas\n4. Verifique: (soma carboidratos porção1 + porção2 + porção3 + ...) ≈ meta carboidratos (40%)\n5. Verifique: (soma proteína porção1 + porção2 + porção3 + ...) ≈ meta proteína (30%)\n6. Verifique: (soma gorduras porção1 + porção2 + porção3 + ...) ≈ meta gorduras (30%)\n\nEXEMPLO:\nSe a meta é 60g de carboidratos total (40% de 600 kcal):\n- Arroz (100g com 28g carboidratos/100g) = 28g carboidratos\n- Feijão (120g com 14g carboidratos/100g) = 16.8g carboidratos\n- Batata doce (150g com 20g carboidratos/100g) = 30g carboidratos\n- SOMA TOTAL = 28 + 16.8 + 30 = 74.8g (ajustar porções para chegar mais perto de 60g)\n\nFaça o mesmo raciocínio para proteína (30%) e gordura (30%).\n\nANÁLISE NUTRICIONAL COMPLETA (OBRIGATÓRIO):\n- Calcule TODAS as calorias totais da refeição com precisão\n- Calcule TODOS os macros totais (proteína, carboidratos, gordura, fibras) em gramas SOMANDO as porções\n- Forneça o índice glicêmico MÉDIO ponderado de todos os alimentos\n- Calcule a carga glicêmica TOTAL da refeição\n- Para CADA alimento, forneça: porção em gramas, medida caseira brasileira, calorias, macros detalhados (incluindo fibras) e índice glicêmico individual\n\nVERIFICAÇÃO FINAL:\nAntes de retornar o resultado, VERIFIQUE:\n- totalMacros.carbs = soma de todas portions[].macros.carbs (deve ser ~40% das calorias)\n- totalMacros.protein = soma de todas portions[].macros.protein (deve ser ~30% das calorias)\n- totalMacros.fat = soma de todas portions[].macros.fat (deve ser ~30% das calorias)\n- totalCalories = soma de todas portions[].calories\n\nSUGESTÕES PERSONALIZADAS (EXTREMAMENTE IMPORTANTE):\nAs sugestões devem ser TOTALMENTE PERSONALIZADAS baseadas nos alimentos ESPECÍFICOS que o usuário escolheu. NÃO forneça dicas genéricas. Analise cada alimento da lista e forneça:\n- Substituições específicas para tornar menos calórico mantendo saciedade\n- Combinações inteligentes entre os alimentos escolhidos que potencializam nutrientes\n- Vegetais específicos que combinam com os alimentos do prato para aumentar volume com poucas calorias\n- Métodos de preparo mais saudáveis aplicáveis aos alimentos da lista\n- Temperos e ervas que agregam sabor sem calorias\nSeja específico, prático e relevante aos alimentos listados.\n\nOUTRAS REGRAS:\n- Todas as respostas devem ser em PORTUGUÊS BRASILEIRO\n- As medidas caseiras (homeMeasure) devem usar termos brasileiros como 'colher de sopa', 'xícara', 'unidade', 'filé pequeno/médio/grande', 'concha', 'escumadeira', 'pires', etc.\n- Seja sempre preciso e útil\n- Responda sempre no formato JSON especificado\n- NÃO simplifique ou omita nenhuma análise nutricional",
                temperature: 0.7,
                topP: 0.8,
                maxOutputTokens: 2048,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as MealResult;

        return result;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to calculate meal portions. The AI model might be busy or an error occurred.");
    }
};
