
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

// User Profile types
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

export interface UserProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    date_of_birth: string | null;
    gender: Gender | null;
    weight: number | null; // em kg
    height: number | null; // em cm
    activity_level: ActivityLevel | null;
    dietary_preferences: string[] | null;
    allergies: string[] | null;
    health_goals: string[] | null;
    created_at: string;
    updated_at: string;
}
