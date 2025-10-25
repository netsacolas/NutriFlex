import type { BMICategory, BMIInfo } from '../types';

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * @param weight Peso em kg
 * @param height Altura em cm
 * @returns IMC arredondado para 1 casa decimal
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10;
}

/**
 * Classifica o IMC de acordo com a tabela da OMS
 * @param bmi Valor do IMC
 * @returns Categoria do IMC
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25.0) return 'normal';
  if (bmi < 30.0) return 'overweight';
  if (bmi < 35.0) return 'obesity_1';
  if (bmi < 40.0) return 'obesity_2';
  return 'obesity_3';
}

/**
 * Retorna informações completas sobre o IMC
 * @param weight Peso em kg
 * @param height Altura em cm
 * @returns Objeto com todas as informações do IMC
 */
export function getBMIInfo(weight: number, height: number): BMIInfo {
  const bmi = calculateBMI(weight, height);
  const category = getBMICategory(bmi);

  const categoryMap: Record<BMICategory, { label: string; color: string; description: string }> = {
    underweight: {
      label: 'Baixo Peso',
      color: '#60a5fa', // blue
      description: 'Abaixo do peso ideal. Consulte um nutricionista.'
    },
    normal: {
      label: 'Peso Normal',
      color: '#4ade80', // green
      description: 'Peso ideal! Continue mantendo hábitos saudáveis.'
    },
    overweight: {
      label: 'Sobrepeso',
      color: '#fbbf24', // yellow
      description: 'Acima do peso ideal. Considere ajustar sua alimentação e exercícios.'
    },
    obesity_1: {
      label: 'Obesidade Grau I',
      color: '#fb923c', // orange
      description: 'Obesidade leve. Recomendado acompanhamento profissional.'
    },
    obesity_2: {
      label: 'Obesidade Grau II',
      color: '#f87171', // red
      description: 'Obesidade moderada. Acompanhamento médico é importante.'
    },
    obesity_3: {
      label: 'Obesidade Grau III',
      color: '#dc2626', // dark red
      description: 'Obesidade mórbida. Procure orientação médica urgentemente.'
    }
  };

  return {
    value: bmi,
    category,
    ...categoryMap[category]
  };
}

/**
 * Calcula a diferença de peso entre duas pesagens
 * @param currentWeight Peso atual
 * @param previousWeight Peso anterior
 * @returns Diferença em kg (positivo = ganhou, negativo = perdeu)
 */
export function getWeightDifference(currentWeight: number, previousWeight: number): number {
  return Math.round((currentWeight - previousWeight) * 10) / 10;
}

/**
 * Formata a diferença de peso para exibição
 * @param difference Diferença em kg
 * @returns String formatada (ex: "-2.5 kg", "+1.2 kg")
 */
export function formatWeightDifference(difference: number): string {
  const sign = difference > 0 ? '+' : '';
  return `${sign}${difference.toFixed(1)} kg`;
}

/**
 * Calcula quantos dias se passaram entre duas datas
 * @param date1 Data mais recente
 * @param date2 Data mais antiga
 * @returns Número de dias
 */
export function getDaysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula a taxa média de perda/ganho de peso por semana
 * @param weightDiff Diferença de peso em kg
 * @param days Número de dias
 * @returns Taxa por semana em kg
 */
export function getWeeklyRate(weightDiff: number, days: number): number {
  if (days === 0) return 0;
  const weeks = days / 7;
  return Math.round((weightDiff / weeks) * 10) / 10;
}
