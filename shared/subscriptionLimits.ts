export type SubscriptionPlanId =
  | 'free'
  | 'premium_monthly'
  | 'premium_quarterly'
  | 'premium_annual';

export interface SubscriptionLimitDefinition {
  dailyMealCalculations: number | null;
  hourlyGeminiCap: number | null;
}

export const subscriptionPlanLimits: Record<SubscriptionPlanId, SubscriptionLimitDefinition> = {
  free: {
    dailyMealCalculations: 2,
    hourlyGeminiCap: 20
  },
  premium_monthly: {
    dailyMealCalculations: null,
    hourlyGeminiCap: null
  },
  premium_quarterly: {
    dailyMealCalculations: null,
    hourlyGeminiCap: null
  },
  premium_annual: {
    dailyMealCalculations: null,
    hourlyGeminiCap: null
  }
};

export const getPlanLimits = (plan: SubscriptionPlanId): SubscriptionLimitDefinition =>
  subscriptionPlanLimits[plan] ?? subscriptionPlanLimits.free;
