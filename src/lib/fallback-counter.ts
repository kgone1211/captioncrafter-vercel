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
      this.counters.set(userId, { freeCaptionsUsed: 0, subscriptionStatus: 'active' });
      console.log(`Created new fallback counter for user ${userId}`);
    }
    const usage = this.counters.get(userId)!;
    console.log(`Fallback counter getUsage for user ${userId}:`, usage);
    return usage;
  }

  incrementUsage(userId: number): void {
    console.log(`Fallback counter incrementUsage called for user ${userId}`);
    const usage = this.getUsage(userId);
    usage.freeCaptionsUsed += 1;
    this.counters.set(userId, usage);
    console.log(`Fallback counter incremented for user ${userId}: ${usage.freeCaptionsUsed}/3`);
  }

  canGenerateCaption(userId: number): boolean {
    const usage = this.getUsage(userId);
    return usage.freeCaptionsUsed < 3;
  }
}

export const fallbackCounter = FallbackCounter.getInstance();
