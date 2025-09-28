// Plan-based feature access and UI components

export interface PlanFeatures {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: {
    captionLimit: number | 'unlimited';
    platforms: string[];
    aiLevel: 'basic' | 'advanced';
    support: 'email' | 'priority';
    calendar: boolean;
    analytics: boolean;
    customPrompts: boolean;
  };
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    interval: 'month',
    features: {
      captionLimit: 3,
      platforms: ['Instagram', 'TikTok', 'Twitter'],
      aiLevel: 'basic',
      support: 'email',
      calendar: false,
      analytics: false,
      customPrompts: false,
    }
  },
  basic: {
    id: 'prod_OAeju0utHppI2',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    features: {
      captionLimit: 100,
      platforms: ['Instagram', 'TikTok', 'Twitter', 'Facebook'],
      aiLevel: 'basic',
      support: 'email',
      calendar: false,
      analytics: false,
      customPrompts: false,
    }
  },
  premium: {
    id: 'prod_Premium123',
    name: 'Premium Plan',
    price: 19.99,
    interval: 'month',
    features: {
      captionLimit: 'unlimited',
      platforms: ['Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn', 'YouTube'],
      aiLevel: 'advanced',
      support: 'priority',
      calendar: true,
      analytics: true,
      customPrompts: true,
    }
  }
};

export function getPlanFeatures(subscriptionStatus: string, planId?: string): PlanFeatures {
  if (subscriptionStatus === 'active' && planId) {
    return PLAN_FEATURES[planId] || PLAN_FEATURES.premium;
  }
  return PLAN_FEATURES.free;
}

export function canAccessFeature(
  subscriptionStatus: string, 
  planId: string | undefined, 
  feature: keyof PlanFeatures['features']
): boolean {
  const plan = getPlanFeatures(subscriptionStatus, planId);
  return !!plan.features[feature];
}

export function getCaptionLimit(subscriptionStatus: string, planId?: string): number | 'unlimited' {
  const plan = getPlanFeatures(subscriptionStatus, planId);
  return plan.features.captionLimit;
}

export function getAvailablePlatforms(subscriptionStatus: string, planId?: string): string[] {
  const plan = getPlanFeatures(subscriptionStatus, planId);
  return plan.features.platforms;
}
