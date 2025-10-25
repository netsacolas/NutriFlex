
export interface MacroNutrients {
    protein: number;
    carbs: number;
    fat: number;
}

export interface Portion extends MacroNutrients {
    foodName: string;
    grams: number;
    homeMeasure: string;
    calories: number;
    macros: MacroNutrients & { fiber?: number };
    glycemicIndex?: number;
}

export interface GlycemicData {
    index: number;
    load: number;
}

export interface MealResult {
    totalCalories: number;
    totalMacros: MacroNutrients & { fiber: number };
    glycemicData: GlycemicData;
    portions: Portion[];
    suggestions: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
