
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
export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obesity_1' | 'obesity_2' | 'obesity_3';
export type GoalType = 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'custom';

export interface UserProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    date_of_birth: string | null;
    age: number | null;
    birth_date: string | null;
    gender: Gender | null;
    weight: number | null; // em kg
    height: number | null; // em cm
    activity_level: ActivityLevel | null;
    dietary_preferences: string[] | null;
    allergies: string[] | null;
    health_goals: string[] | null;
    meals_per_day: number | null;
    breakfast_calories: number | null;
    lunch_calories: number | null;
    dinner_calories: number | null;
    snack_calories: number | null;
    created_at: string;
    updated_at: string;
}

export interface WeightEntry {
    id: string;
    user_id: string;
    weight: number; // em kg
    height: number | null; // em cm
    bmi: number | null;
    bmi_category: BMICategory | null;
    measured_at: string;
    notes: string | null;
    ai_analysis: string | null;
    created_at: string;
}

export interface Goal {
    id: string;
    user_id: string;
    goal_type: GoalType;
    target_weight: number | null;
    target_date: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface Achievement {
    id: string;
    user_id: string;
    achievement_type: string;
    title: string;
    description: string | null;
    icon: string | null;
    achieved_at: string;
    metadata: Record<string, any> | null;
}

export interface BMIInfo {
    value: number;
    category: BMICategory;
    label: string;
    color: string;
    description: string;
}

// Meal Consumption History
export interface MealConsumption {
    id: string;
    user_id: string;
    meal_type: MealType;
    consumed_at: string;
    total_calories: number;
    total_protein: number | null;
    total_carbs: number | null;
    total_fat: number | null;
    total_fiber: number | null;
    glycemic_index: number | null;
    glycemic_load: number | null;
    portions: Portion[];
    notes: string | null;
    created_at: string;
}

// Physical Activity types
export type ActivityIntensity = 'low' | 'moderate' | 'high';

export interface PhysicalActivity {
    id: string;
    user_id: string;
    activity_type: string;
    duration_minutes: number;
    intensity: ActivityIntensity;
    calories_burned: number | null;
    performed_at: string;
    notes: string | null;
    created_at: string;
}
