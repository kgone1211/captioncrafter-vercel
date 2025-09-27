// Simple in-memory counter for fallback when database is not available

interface FallbackUsage {
  freeCaptionsUsed: number;
  subscriptionStatus: string;
}

class FallbackCounter {
  private static instance: FallbackCounter;
  private counters: Map<number, FallbackUsage> = new Map();

  static getInstance(): FallbackCounter {
    if (!FallbackCounter.instance) {
      FallbackCounter.instance = new FallbackCounter();
    }
    return FallbackCounter.instance;
  }

  getUsage(userId: number): FallbackUsage {
    if (!this.counters.has(userId)) {
      this.counters.set(userId, { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' });
      console.log(`Created new fallback counter for user ${userId}`);
    }
    const usage = this.counters.get(userId)!;
    console.log(`Fallback counter getUsage for user ${userId}:`, usage);
    return usage;
  }

  incrementUsage(userId: number): void {
    console.log(`Fallback counter incrementUsage called for user ${userId}`);
    const usage = this.getUsage(userId);
    
    // Only increment if user is on free plan (inactive subscription)
    if (usage.subscriptionStatus === 'inactive') {
      usage.freeCaptionsUsed += 1;
      this.counters.set(userId, usage);
      console.log(`Fallback counter incremented for user ${userId}: ${usage.freeCaptionsUsed}/3`);
    } else {
      console.log(`User ${userId} has active subscription, not incrementing free counter`);
    }
  }

  canGenerateCaption(userId: number): boolean {
    const usage = this.getUsage(userId);
    
    // If user has active subscription, they can always generate
    if (usage.subscriptionStatus === 'active') {
      return true;
    }
    
    // For free users, check if they've used less than 3 captions
    return usage.freeCaptionsUsed < 3;
  }

  upgradeToSubscription(userId: number, planId: string): void {
    console.log(`Upgrading user ${userId} to subscription for plan ${planId}`);
    const usage = this.getUsage(userId);
    usage.subscriptionStatus = 'active';
    this.counters.set(userId, usage);
    console.log(`User ${userId} upgraded to active subscription`);
  }

  resetUsage(userId: number): void {
    this.counters.set(userId, { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' });
    console.log(`Reset fallback counter for user ${userId}`);
  }

  resetAll(): void {
    this.counters.clear();
    console.log('Reset all fallback counters');
  }
}

export const fallbackCounter = FallbackCounter.getInstance();
