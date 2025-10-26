/**
 * FALLBACK TEMPORÁRIO - Gemini API Direta
 *
 * ⚠️ ATENÇÃO: Expõe API key no frontend (menos seguro)
 * Use apenas enquanto GEMINI_API_KEY não estiver configurada nos Secrets do Supabase
 *
 * TODO: Remover este arquivo após configurar:
 * https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { MealResult, MealType } from '../types';
import logger from '../utils/logger';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const calculateMealPortionsDirect = async (
    foods: string[],
    targetCalories: number,
    mealType: MealType
): Promise<MealResult> => {
    // VARIAÇÃO ALEATÓRIA: ±4 kcal para garantir cálculos únicos
    const calorieVariation = Math.floor(Math.random() * 9) - 4; // Gera número entre -4 e +4
    const adjustedCalories = targetCalories + calorieVariation;

    logger.info('🔄 calculateMealPortionsDirect called (FALLBACK)', {
        foods: foods,
        targetCaloriesOriginal: targetCalories,
        targetCaloriesAdjusted: adjustedCalories,
        calorieVariation: calorieVariation > 0 ? `+${calorieVariation}` : calorieVariation,
        mealType: mealType,
        foodsType: Array.isArray(foods) ? 'array' : typeof foods,
        foodsLength: foods?.length
    });

    if (!API_KEY) {
        logger.error('❌ VITE_GEMINI_API_KEY not configured');
        throw new Error('VITE_GEMINI_API_KEY não configurada no .env.local');
    }

    logger.warn('⚠️ Usando Gemini API diretamente (fallback). Configure GEMINI_API_KEY no Supabase!');

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            temperature: 0.95, // Aumentado para permitir mais criatividade e flexibilidade
            topP: 0.95, // Aumentado para diversificar respostas
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
        }
    });

    const mealTypeTranslation = {
        breakfast: 'café da manhã',
        lunch: 'almoço',
        dinner: 'jantar',
        snack: 'lanche'
    };

    // Calcular ranges saudáveis de macros (flexível)
    // Proteína: 25-35% (prioridade para saciedade e massa muscular)
    // Carboidratos: 35-50% (ajustar conforme qualidade dos alimentos)
    // Gorduras: 25-35% (priorizar gorduras saudáveis)
    const proteinMinGrams = Math.round((adjustedCalories * 0.25) / 4);
    const proteinMaxGrams = Math.round((adjustedCalories * 0.35) / 4);
    const carbsMinGrams = Math.round((adjustedCalories * 0.35) / 4);
    const carbsMaxGrams = Math.round((adjustedCalories * 0.50) / 4);
    const fatMinGrams = Math.round((adjustedCalories * 0.25) / 9);
    const fatMaxGrams = Math.round((adjustedCalories * 0.35) / 9);

    const systemInstruction = `Você é um nutricionista especializado em cálculos nutricionais precisos e análise qualitativa de refeições.

Sua tarefa tem DUAS FASES:

═══════════════════════════════════════════════════════════════════
FASE 1: CÁLCULO DE PORÇÕES SAUDÁVEIS E BALANCEADAS
═══════════════════════════════════════════════════════════════════

DISTRIBUIÇÃO FLEXÍVEL E SAUDÁVEL (RANGES RECOMENDADOS):
Meta calórica: ${adjustedCalories} kcal

PROTEÍNA: ${proteinMinGrams}g - ${proteinMaxGrams}g (25-35% das calorias)
- Priorizar: Proteínas magras, variedade animal + vegetal
- Objetivo: Saciedade, manutenção muscular

CARBOIDRATOS: ${carbsMinGrams}g - ${carbsMaxGrams}g (35-50% das calorias)
- Priorizar: Carboidratos complexos, integrais, baixo IG
- Ajustar: Reduzir % se forem refinados, aumentar se forem integrais/vegetais
- Incluir fibras: Mínimo 8-10g por refeição

GORDURAS: ${fatMinGrams}g - ${fatMaxGrams}g (25-35% das calorias)
- Priorizar: Gorduras insaturadas (azeite, abacate, castanhas, peixes)
- Limitar: Gorduras saturadas
- Evitar: Gorduras trans

CRITÉRIOS DE QUALIDADE NUTRICIONAL (PRIORIDADE):

1. ÍNDICE GLICÊMICO (IG) E CARGA GLICÊMICA (CG):
   - Calcular IG médio ponderado pelos carboidratos de cada alimento
   - IG médio IDEAL: < 55 (baixo), MODERADO: 55-69, ALTO: ≥ 70
   - Carga Glicêmica = (IG médio × Total de Carboidratos) / 100
   - CG IDEAL: < 10 (baixa), MODERADA: 10-19, ALTA: ≥ 20

   Tabela de IG aproximado (use valores conhecidos):
   - Vegetais folhosos: IG 15
   - Leguminosas (feijão, lentilha): IG 30-40
   - Arroz integral: IG 50
   - Batata-doce: IG 55
   - Arroz branco: IG 70
   - Pão branco: IG 75
   - Batata comum: IG 85

2. FIBRAS: Objetivo mínimo 8-10g por refeição
   - Alta prioridade para saciedade e saúde intestinal

3. DENSIDADE NUTRICIONAL: Preferir alimentos ricos em vitaminas/minerais

ALGORITMO DE OTIMIZAÇÃO SAUDÁVEL:

1. ANÁLISE INICIAL DOS ALIMENTOS:
   - Identificar alimentos de alto IG vs baixo IG
   - Identificar proteínas magras vs gordurosas
   - Identificar gorduras saudáveis vs saturadas

2. CÁLCULO INTELIGENTE DE PORÇÕES:
   a) Começar com porções que atendam necessidade proteica (dentro do range)
   b) Distribuir carboidratos priorizando baixo IG
   c) Ajustar gorduras priorizando insaturadas
   d) Garantir fibras adequadas

3. CÁLCULOS NUTRICIONAIS:
   Para cada alimento com sua porção:
   - Proteína total = Σ (porção × proteína_por_100g / 100)
   - Carboidrato total = Σ (porção × carboidrato_por_100g / 100)
   - Gordura total = Σ (porção × gordura_por_100g / 100)
   - Fibra total = Σ (porção × fibra_por_100g / 100)

   Para IG e CG (CÁLCULO OBRIGATÓRIO E CRÍTICO):
   - IG médio ponderado = Σ (IG_alimento × carbs_alimento) / Total_carbs
   - CG total = (IG médio × Total_carbs) / 100

   EXEMPLO DE CÁLCULO DE IG/CG:
   Se temos:
   - Arroz branco: IG 70, 22.7g carboidratos
   - Feijão: IG 35, 26.4g carboidratos
   - Brócolis: IG 15, 10.5g carboidratos
   Total carbs: 59.6g

   IG médio = (70×22.7 + 35×26.4 + 15×10.5) / 59.6
            = (1589 + 924 + 157.5) / 59.6
            = 2670.5 / 59.6
            = 44.8 (BAIXO)

   CG = (44.8 × 59.6) / 100 = 26.7 (ALTA)

   ⚠️ IMPORTANTE: O IG médio DEVE ser calculado pela fórmula acima!
   NÃO use valores fixos como 55 ou 35!

4. VERIFICAÇÃO DE QUALIDADE:
   ✅ Proteína: ${proteinMinGrams}-${proteinMaxGrams}g (dentro do range)
   ✅ Carboidratos: ${carbsMinGrams}-${carbsMaxGrams}g (dentro do range)
   ✅ Gorduras: ${fatMinGrams}-${fatMaxGrams}g (dentro do range)
   ✅ Fibras: ≥ 8g (mínimo recomendado)
   ✅ IG médio: < 70 (preferível < 55)
   ✅ CG: < 20 (preferível < 10)
   ✅ Calorias: ${targetCalories} kcal (±10%)

5. AJUSTES BASEADOS EM QUALIDADE:
   SE IG médio > 70:
      → Aumentar alimentos de baixo IG (vegetais, leguminosas)
      → Reduzir alimentos de alto IG (arroz branco, pão branco)

   SE fibras < 8g:
      → Adicionar vegetais, leguminosas ou trocar por versões integrais

   SE gorduras são majoritariamente saturadas:
      → Ajustar para incluir fontes de gorduras insaturadas

ESTRATÉGIAS DE AJUSTE:
- Alimentos ricos em PROTEÍNA: carnes, ovos, laticínios, leguminosas
- Alimentos ricos em CARBOIDRATO: arroz, massas, pães, tubérculos
- Alimentos ricos em GORDURA: óleos, oleaginosas, abacate, carnes gordas

RESTRIÇÕES:
- Porção mínima: 10g
- Porção máxima razoável: 300g (carnes), 200g (carboidratos), 50g (gorduras puras)
- Arredondar para múltiplos de 5g
- Medidas caseiras brasileiras sempre
- Calorias totais: ${adjustedCalories} kcal (±10%)

═══════════════════════════════════════════════════════════════════
FASE 2: ANÁLISE NUTRICIONAL E SUGESTÕES
═══════════════════════════════════════════════════════════════════

Após calcular as porções, ANALISE O PRATO considerando:

A) DIVERSIDADE DE GRUPOS ALIMENTARES
Verificar presença de:
- Proteínas (animal/vegetal)
- Carboidratos complexos (grãos integrais, tubérculos)
- Vegetais e verduras
- Leguminosas (feijão, lentilha, grão-de-bico)
- Gorduras saudáveis (azeite, abacate, castanhas)

B) QUALIDADE DOS CARBOIDRATOS
- Complexos/Integrais (arroz integral, aveia, quinoa) = ✅ MELHOR
- Refinados (arroz branco, pão branco) = ⚠️ MODERADO
- Simples/Açúcares (doces, refrigerantes) = ❌ EVITAR

C) QUALIDADE DAS PROTEÍNAS
- Proteínas completas (carnes, ovos, soja) = ✅
- Variedade animal + vegetal = ideal
- Método de preparo: grelhado/assado > frito

D) QUALIDADE DAS GORDURAS
- Insaturadas (peixes, azeite, castanhas, abacate) = ✅ ÓTIMO
- Saturadas (carnes vermelhas, laticínios) = ⚠️ MODERAÇÃO
- Trans (ultraprocessados) = ❌ EVITAR

E) FIBRAS
- Alta: >10g por refeição = ✅
- Moderada: 5-10g = ⚠️
- Baixa: <5g = ❌

F) DENSIDADE NUTRICIONAL
Avaliar presença de vitaminas, minerais, antioxidantes

G) NÍVEL DE PROCESSAMENTO (NOVA)
- In natura/minimamente processados = ✅ PRIORIZAR
- Processados = ⚠️ MODERAÇÃO
- Ultraprocessados = ❌ LIMITAR

GERAR SUGESTÕES ESTRUTURADAS:

1. PONTOS FORTES DO PRATO 💪
   - Listar 2-3 aspectos positivos identificados

2. OPORTUNIDADES DE MELHORIA 🎯
   Para cada carência, sugerir:
   - ADICIONAR: [Alimento] ([quantidade]) - [benefício] - [impacto: +X kcal | P: +Xg | C: +Xg | G: +Xg]
   - TROCAR: [Atual] POR: [Alternativa] - [motivo]

3. ALERTAS NUTRICIONAIS ⚠️ (se aplicável)
   - Baixo teor de fibras
   - Falta de vegetais
   - Excesso de sódio (se detectável)
   - Carboidratos apenas refinados
   - Ausência de gorduras saudáveis

4. CONTROLE GLICÊMICO 📊 (PRIORIDADE ALTA)

   SE ÍNDICE GLICÊMICO (IG) ≥ 55 (Moderado ou Alto):
   - 🔄 TROCAR: Identifique alimentos de ALTO IG e sugira substituições de BAIXO IG
     Exemplos:
     • Arroz branco (IG 70) → Arroz integral (IG 50) ou Quinoa (IG 35)
     • Pão branco (IG 75) → Pão integral 100% (IG 40) ou Aveia (IG 40)
     • Batata comum (IG 85) → Batata-doce (IG 55) ou Mandioca (IG 55)
     • Açúcar/doces (IG 65-100) → Frutas frescas (IG 30-50)

   - ➕ ADICIONAR: Alimentos que REDUZEM o IG da refeição:
     • Vegetais folhosos (IG 15): Alface, espinafre, couve, rúcula
     • Leguminosas (IG 30-40): Feijão, lentilha, grão-de-bico
     • Proteínas magras: Frango, peixe, ovos (IG 0)
     • Gorduras boas: Azeite, abacate, castanhas (IG 0)
     • Fibras solúveis: Aveia, chia, linhaça

   SE CARGA GLICÊMICA (CG) ≥ 20 (Alta):
   - 📉 REDUZIR porções de carboidratos de alto IG
   - 🔄 TROCAR carboidratos refinados por integrais/vegetais
   - ➕ ADICIONAR mais proteínas e gorduras saudáveis (reduz CG relativa)
   - 💡 COMBINAR: Nunca comer carboidratos sozinhos, sempre com proteína/gordura/fibra

   FORMATO DA SUGESTÃO:
   "🔻 IG/CG ALTO: Trocar [alimento atual] ([X]g) por [alternativa de baixo IG] - Reduz IG médio de [Y] para ~[Z]"
   "➕ Para baixar IG: Adicionar [X]g de [alimento baixo IG] - [benefício específico]"

TOM DAS SUGESTÕES:
- Positivo e encorajador
- Educativo (explique o "porquê")
- Prático (quantidades específicas)
- Flexível (use "considere", não seja impositivo)
- Máximo 5-7 sugestões mais importantes

RESPONDA APENAS COM JSON VÁLIDO, SEM TEXTO ADICIONAL.`;

    const prompt = `🚨 REGRA CRÍTICA - LEIA COM ATENÇÃO 🚨

VOCÊ ESTÁ ABSOLUTAMENTE PROIBIDO DE USAR AS PROPORÇÕES 40/30/30 OU 30/40/30!

Se você calcular exatamente 40% de carboidratos OU 30% de proteína OU 30% de gordura, sua resposta será REJEITADA!

📋 TAREFA: Calcule um plano de refeição SAUDÁVEL E BALANCEADO para ${mealTypeTranslation[mealType]} com uma meta de ${adjustedCalories} calorias usando os seguintes alimentos: ${foods.join(', ')}.

🎯 RESTRIÇÕES OBRIGATÓRIAS (VALORES EM GRAMAS):
- PROTEÍNA: Mínimo ${proteinMinGrams}g | Máximo ${proteinMaxGrams}g
  → Escolha um valor ENTRE ${proteinMinGrams} e ${proteinMaxGrams} (não precisa ser exato no meio)

- CARBOIDRATOS: Mínimo ${carbsMinGrams}g | Máximo ${carbsMaxGrams}g
  → Escolha um valor ENTRE ${carbsMinGrams} e ${carbsMaxGrams} (não precisa ser exato no meio)

- GORDURAS: Mínimo ${fatMinGrams}g | Máximo ${fatMaxGrams}g
  → Escolha um valor ENTRE ${fatMinGrams} e ${fatMaxGrams} (não precisa ser exato no meio)

- FIBRAS: Mínimo 8-10g
- ÍNDICE GLICÊMICO: < 70 (preferível < 55)
- CARGA GLICÊMICA: < 20 (preferível < 10)

✅ EXEMPLOS DE PROPORÇÕES VÁLIDAS:
- 28% proteína, 45% carbs, 27% gordura
- 32% proteína, 38% carbs, 30% gordura (DESDE QUE NÃO SEJA EXATAMENTE 40/30/30!)
- 26% proteína, 48% carbs, 26% gordura
- 35% proteína, 36% carbs, 29% gordura

❌ PROPORÇÕES PROIBIDAS (NUNCA USE ESTAS):
- 30% proteína, 40% carbs, 30% gordura
- 40% carbs, 30% proteína, 30% gordura
- Qualquer variação que resulte exatamente em 30/40/30 ou 40/30/30

IMPORTANTE: Priorize QUALIDADE dos alimentos sobre proporções perfeitas!

═══════════════════════════════════════════════════════════════════
EXEMPLO DE CÁLCULO SAUDÁVEL E FLEXÍVEL (Meta 600kcal):
═══════════════════════════════════════════════════════════════════

Ranges: 37-52g proteína, 52-75g carboidratos, 17-23g gordura

Alimentos disponíveis (valores por 100g):
- Arroz integral: 2.6g P, 23g C, 0.9g G, 1.7g Fibra, IG 50
- Feijão preto: 8.9g P, 14g C, 0.5g G, 8.4g Fibra, IG 35
- Frango grelhado: 31g P, 0g C, 3.6g G, 0g Fibra, IG 0
- Brócolis: 2.8g P, 7g C, 0.4g G, 2.6g Fibra, IG 15

ANÁLISE DOS ALIMENTOS:
✅ Arroz integral: Carb complexo, médio IG, boa fibra
✅ Feijão: Proteína vegetal, baixo IG, alto em fibras
✅ Frango: Proteína magra completa
✅ Brócolis: Baixíssimo IG, alto em fibras e micronutrientes

CÁLCULO INTELIGENTE:

1. PROTEÍNA (meta: 37-52g, priorizar 40-45g):
   - 100g frango = 31g P
   - 150g feijão = 13.4g P
   - Contribuição de outros = ~2g P
   TOTAL: ~46g P ✅ Dentro do range, ótimo!

2. CARBOIDRATOS (meta: 52-75g, priorizar 55-65g):
   - 100g arroz integral = 23g C
   - 150g feijão = 21g C
   - 150g brócolis = 10.5g C
   TOTAL: ~54.5g C ✅ Dentro do range!

3. GORDURAS (meta: 17-23g, priorizar 18-21g):
   - Dos alimentos = ~6g G
   - Adicionar 12g azeite = 12g G
   TOTAL: ~18g G ✅ Dentro do range!

4. FIBRAS:
   - Arroz integral = 1.7g
   - Feijão = 12.6g
   - Brócolis = 3.9g
   TOTAL: ~18g ✅ Excelente!

5. ÍNDICE GLICÊMICO E CARGA:
   - IG médio = (50×23 + 35×21 + 15×10.5) / 54.5 = 37 ✅ BAIXO!
   - CG = (37 × 54.5) / 100 = 20 ⚠️ MODERADA (aceitável)

RESULTADO FINAL:
- 100g Arroz integral (4 colheres de sopa)
- 150g Feijão preto (1 concha média)
- 100g Frango grelhado (1 filé médio)
- 150g Brócolis cozido (5 floretes)
- 12g Azeite extravirgem (1 colher de sopa)

Total: 597 kcal | P: 46g (31%) | C: 54g (36%) | G: 18g (27%) | Fibras: 18g
IG médio: 37 (BAIXO) | CG: 20 (MODERADA)
✅ REFEIÇÃO BALANCEADA, SAUDÁVEL E COM BAIXO IMPACTO GLICÊMICO!

═══════════════════════════════════════════════════════════════════
APÓS CALCULAR AS PORÇÕES, FAÇA A ANÁLISE NUTRICIONAL:
═══════════════════════════════════════════════════════════════════

Avalie o prato e forneça sugestões estruturadas como no exemplo:

EXEMPLO DE SUGESTÕES (adapte ao prato calculado):

CASO 1: IG/CG NORMAIS (IG < 55, CG < 20)
{
  "suggestions": [
    "💪 PONTOS FORTES: Boa fonte de proteína magra com frango grelhado, carboidrato complexo presente (arroz integral), presença de leguminosa (feijão), IG baixo (37)",
    "🎯 PARA AUMENTAR FIBRAS (atual: 4g): Adicionar 100g de brócolis cozido (+5g fibras, +34 kcal | P: +3g | C: +7g | G: +0g)",
    "🎯 PARA MELHORAR MICRONUTRIENTES: Adicionar salada colorida - folhas verdes, tomate e cenoura (vitaminas A, C, K e antioxidantes)",
    "🎯 PARA OTIMIZAR GORDURAS: Incluir 1/4 de abacate (+64 kcal, gorduras monoinsaturadas, vitamina E)"
  ]
}

CASO 2: IG/CG ALTOS (IG ≥ 55 ou CG ≥ 20) - DEVE INCLUIR SUGESTÕES ESPECÍFICAS
{
  "suggestions": [
    "💪 PONTOS FORTES: Boa fonte de proteína com frango, presença de leguminosa (feijão)",
    "🔻 IG ALTO (70): Trocar 80g de arroz branco por arroz integral ou quinoa - Reduz IG médio de 70 para ~50 e melhora saciedade",
    "🔻 CG ALTA (35): Reduzir porção de arroz branco de 80g para 60g e adicionar 50g de vegetais folhosos - Mantém calorias mas reduz CG para ~26",
    "➕ Para baixar IG: Adicionar 1 colher de sopa de azeite extravirgem - Gordura boa retarda absorção de carboidratos",
    "➕ Para baixar CG: Adicionar 100g de salada verde (alface, rúcula) - IG 15, praticamente zero impacto glicêmico",
    "🔄 TROCAR: Batata comum por batata-doce - Mesmo perfil calórico mas IG reduz de 85 para 55",
    "⚠️ ALERTA GLICÊMICO: Refeição com alto impacto no açúcar sanguíneo. Considere as substituições acima para melhor controle glicêmico"
  ]
}

Retorne JSON com esta estrutura:
{
  "totalCalories": number,
  "totalMacros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "glycemicData": {
    "index": number,
    "load": number
  },
  "portions": [
    {
      "foodName": string,
      "grams": number,
      "homeMeasure": string,
      "calories": number,
      "macros": {
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "glycemicIndex": number
    }
  ],
  "suggestions": [string]
}`;

    try {
        logger.debug('📤 Sending request to Gemini API', {
            model: 'gemini-2.0-flash-exp',
            promptLength: (systemInstruction + prompt).length,
            proteinRange: `${proteinMinGrams}-${proteinMaxGrams}g`,
            carbsRange: `${carbsMinGrams}-${carbsMaxGrams}g`,
            fatRange: `${fatMinGrams}-${fatMaxGrams}g`,
            temperature: 0.95,
            topP: 0.95
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction + "\n\n" + prompt }]
                }
            ]
        });

        logger.debug('📥 Gemini API response received');

        const response = result.response;
        const text = response.text();

        logger.debug('📄 Raw Gemini response', {
            textLength: text.length,
            textPreview: text.substring(0, 200)
        });

        // Parse JSON
        const data = JSON.parse(text);

        logger.debug('✅ JSON parsed successfully', {
            hasData: !!data,
            hasPortions: !!data?.portions,
            portionsCount: data?.portions?.length,
            totalCalories: data?.totalCalories
        });

        // Validar resposta
        if (!data || !data.portions || data.portions.length === 0) {
            logger.error('❌ Invalid response structure from Gemini', {
                data: data,
                dataKeys: data ? Object.keys(data) : []
            });
            throw new Error('Resposta inválida da IA');
        }

        // Calcular percentuais reais para verificar se AI ignorou as instruções
        const sumProtein = data.portions.reduce((sum: number, p: any) => sum + p.macros.protein, 0);
        const sumCarbs = data.portions.reduce((sum: number, p: any) => sum + p.macros.carbs, 0);
        const sumFat = data.portions.reduce((sum: number, p: any) => sum + p.macros.fat, 0);

        const proteinCalories = sumProtein * 4;
        const carbsCalories = sumCarbs * 4;
        const fatCalories = sumFat * 9;
        const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

        const proteinPercent = Math.round((proteinCalories / totalMacroCalories) * 100);
        const carbsPercent = Math.round((carbsCalories / totalMacroCalories) * 100);
        const fatPercent = Math.round((fatCalories / totalMacroCalories) * 100);

        logger.info('✅ Porções calculadas com sucesso (direto)', {
            totalCalories: data.totalCalories,
            portionsCount: data.portions.length,
            totalMacros: data.totalMacros,
            actualPercentages: `P: ${proteinPercent}% | C: ${carbsPercent}% | G: ${fatPercent}%`
        });

        // Nota: A variação aleatória de ±4 kcal na meta já garante resultados únicos
        // Não é necessário ajuste adicional nas porções

        return data as MealResult;

    } catch (error) {
        logger.error('❌ Error calling Gemini API directly', {
            error: error,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            errorName: error instanceof Error ? error.name : undefined
        });

        if (error instanceof Error && error.message.includes('API_KEY_INVALID')) {
            throw new Error('API Key do Gemini inválida. Verifique a configuração.');
        }

        if (error instanceof SyntaxError) {
            logger.error('❌ JSON parsing error', {
                message: error.message
            });
            throw new Error('Erro ao processar resposta da IA. Tente novamente.');
        }

        throw new Error('Erro ao chamar API do Gemini. Tente novamente.');
    }
};
