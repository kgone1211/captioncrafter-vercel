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
      platforms: ['instagram', 'tiktok', 'x'],
      aiLevel: 'basic',
      support: 'email',
      calendar: false,
      analytics: false,
      customPrompts: false,
    }
  },
  basic: {
    id: 'plan_cs24bg68DSLES',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    features: {
      captionLimit: 'unlimited',
      platforms: ['instagram', 'tiktok', 'x', 'facebook'],
      aiLevel: 'basic',
      support: 'email',
      calendar: true,
      analytics: false,
      customPrompts: false,
    }
  },
  premium: {
    id: 'plan_bB3i8FYLYYBI8',
    name: 'Premium Plan',
    price: 19.99,
    interval: 'month',
    features: {
      captionLimit: 'unlimited',
      platforms: ['instagram', 'tiktok', 'x', 'facebook', 'linkedin', 'youtube', 'threads', 'telegram'],
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
    // Map Whop plan IDs to our internal plan features
    const planMapping: Record<string, string> = {
      'plan_cs24bg68DSLES': 'basic',  // Basic Plan
      'plan_bB3i8FYLYYBI8': 'premium', // Premium Plan
      // Legacy plan IDs for backwards compatibility
      'prod_OAeju0utHppI2': 'basic',
      'prod_xcU9zERSGgyNK': 'premium',
      'prod_Premium123': 'premium',
    };
    
    const mappedPlanId = planMapping[planId] || 'premium'; // Default to premium for unknown active plans
    return PLAN_FEATURES[mappedPlanId] || PLAN_FEATURES.premium;
  }
  
  // For inactive subscriptions or no plan ID, return free plan
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
