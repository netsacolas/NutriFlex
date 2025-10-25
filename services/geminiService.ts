
import { GoogleGenAI, Type } from '@google/genai';
import { MealResult, MealType } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

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
                        },
                         required: ["protein", "carbs", "fat"],
                    },
                },
                required: ["foodName", "grams", "homeMeasure", "calories", "macros"],
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

        // Calcular distribuição de macros baseado na meta de calorias
        // 33% proteína (4 kcal/g), 33% gordura (9 kcal/g), 34% carboidrato (4 kcal/g)
        const proteinCalories = Math.round(targetCalories * 0.33);
        const fatCalories = Math.round(targetCalories * 0.33);
        const carbCalories = Math.round(targetCalories * 0.34);

        const proteinGrams = Math.round(proteinCalories / 4);
        const fatGrams = Math.round(fatCalories / 9);
        const carbGrams = Math.round(carbCalories / 4);

        const prompt = `Calcule um plano de refeição para ${mealTypeTranslation[mealType]} com uma meta de ${targetCalories} calorias usando os seguintes alimentos: ${foods.join(', ')}.

DISTRIBUIÇÃO DE MACRONUTRIENTES OBRIGATÓRIA:
- Proteína: ${proteinGrams}g (33% das calorias = ${proteinCalories} kcal)
- Gordura: ${fatGrams}g (33% das calorias = ${fatCalories} kcal)
- Carboidratos: ${carbGrams}g (34% das calorias = ${carbCalories} kcal)

Ajuste as porções de cada alimento para atingir EXATAMENTE essa distribuição de macronutrientes. Priorize essa distribuição acima de tudo.
Forneça quantidades precisas em gramas, medidas caseiras comuns (em português brasileiro), e uma análise nutricional completa.

IMPORTANTE - SUGESTÕES PERSONALIZADAS:
Analise os alimentos específicos escolhidos pelo usuário (${foods.join(', ')}) e forneça de 3 a 5 sugestões PERSONALIZADAS que incluam:
1. Substituições inteligentes para tornar a refeição menos calórica mantendo saciedade (ex: "Substitua o arroz branco por arroz integral ou quinoa para reduzir calorias e aumentar fibras")
2. Combinações saudáveis que potencializam nutrientes (ex: "Adicione limão ao brócolis para melhorar a absorção de ferro")
3. Opções de vegetais ou temperos que podem ser adicionados sem impacto calórico significativo
4. Alternativas de preparo mais saudáveis (ex: grelhado ao invés de frito, assar ao invés de fritar)
5. Sugestões específicas baseadas no tipo de refeição (${mealTypeTranslation[mealType]})

As sugestões devem ser práticas, específicas para os alimentos escolhidos, e focadas em melhorar qualidade nutricional e reduzir calorias quando possível.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                systemInstruction: "Você é o NutriFlex AI, um nutricionista especialista. Sua tarefa é calcular os tamanhos precisos das porções para uma lista de alimentos específica para atingir uma meta de calorias para uma refeição. Você também deve fornecer uma análise nutricional detalhada, incluindo macros, fibras, índice glicêmico e carga glicêmica.\n\nREGRA MAIS IMPORTANTE - DISTRIBUIÇÃO DE MACRONUTRIENTES:\nA distribuição DEVE seguir OBRIGATORIAMENTE: 33% de proteína, 33% de gordura, 34% de carboidratos (em relação às calorias totais). Ajuste as porções de cada alimento para atingir essa distribuição o mais próximo possível. Esta é a PRIORIDADE MÁXIMA.\n\nSUGESTÕES PERSONALIZADAS (EXTREMAMENTE IMPORTANTE):\nAs sugestões devem ser TOTALMENTE PERSONALIZADAS baseadas nos alimentos ESPECÍFICOS que o usuário escolheu. NÃO forneça dicas genéricas. Analise cada alimento da lista e forneça:\n- Substituições específicas para tornar menos calórico (ex: se tem 'frango frito', sugira 'frango grelhado'; se tem 'arroz branco', sugira 'arroz integral ou couve-flor')\n- Combinações inteligentes entre os alimentos escolhidos ou novos ingredientes que potencializam nutrientes\n- Vegetais específicos que combinam com os alimentos do prato para aumentar volume com poucas calorias\n- Métodos de preparo mais saudáveis aplicáveis aos alimentos da lista\n- Temperos e ervas que agregam sabor sem calorias\nSeja específico, prático e relevante aos alimentos listados.\n\nOUTRAS REGRAS:\n- Todas as respostas devem ser em PORTUGUÊS BRASILEIRO\n- As medidas caseiras (homeMeasure) devem usar termos brasileiros como 'colher de sopa', 'xícara', 'unidade', 'filé pequeno', 'concha', 'escumadeira', 'pires', etc.\n- Seja sempre preciso e útil\n- Responda sempre no formato JSON especificado",
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
