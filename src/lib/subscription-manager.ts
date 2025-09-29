// Subscription Management Service for Recurring Billing

import { db } from './db';

export interface SubscriptionInfo {
  userId: number;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  subscriptionStartDate: Date;
  paymentMethodId?: string;
  whopSubscriptionId?: string;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: number,
    planId: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    paymentMethodId?: string,
    whopSubscriptionId?: string
  ): Promise<void> {
    const now = new Date();
    const nextBillingDate = this.calculateNextBillingDate(now, billingCycle);

    console.log(`Creating subscription for user ${userId}:`, {
      planId,
      billingCycle,
      nextBillingDate,
      paymentMethodId,
      whopSubscriptionId
    });

    // Update user with subscription info
    await db.upsertUser(
      `user-${userId}@example.com`, // We'll need to get the actual email
      userId.toString(),
      'active',
      undefined, // username
      planId,
      billingCycle,
      nextBillingDate,
      now,
      paymentMethodId,
      whopSubscriptionId
    );

    console.log(`Subscription created successfully for user ${userId}`);
  }

  /**
   * Renew a subscription (called monthly/yearly)
   */
  async renewSubscription(userId: number): Promise<boolean> {
    try {
      const usage = await db.getUserUsage(userId);
      
      if (!usage.planId || !usage.billingCycle || !usage.nextBillingDate) {
        console.error(`User ${userId} has incomplete subscription data`);
        return false;
      }

      const now = new Date();
      const nextBillingDate = this.calculateNextBillingDate(now, usage.billingCycle as 'monthly' | 'yearly');

      console.log(`Renewing subscription for user ${userId}:`, {
        currentBillingDate: usage.nextBillingDate,
        newBillingDate: nextBillingDate,
        planId: usage.planId,
        billingCycle: usage.billingCycle
      });

      // Update next billing date
      await db.upsertUser(
        `user-${userId}@example.com`,
        userId.toString(),
        'active',
        undefined,
        usage.planId,
        usage.billingCycle,
        nextBillingDate,
        usage.subscriptionStartDate,
        usage.paymentMethodId,
        usage.whopSubscriptionId
      );

      console.log(`Subscription renewed successfully for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error renewing subscription for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: number): Promise<void> {
    console.log(`Cancelling subscription for user ${userId}`);

    await db.upsertUser(
      `user-${userId}@example.com`,
      userId.toString(),
      'cancelled',
      undefined,
      undefined, // planId
      undefined, // billingCycle
      undefined, // nextBillingDate
      undefined, // subscriptionStartDate
      undefined, // paymentMethodId
      undefined  // whopSubscriptionId
    );

    console.log(`Subscription cancelled for user ${userId}`);
  }

  /**
   * Check if subscription is expired and needs renewal
   */
  async checkSubscriptionExpiry(userId: number): Promise<{
    isExpired: boolean;
    daysUntilExpiry: number;
    needsRenewal: boolean;
  }> {
    try {
      const usage = await db.getUserUsage(userId);
      
      if (!usage.nextBillingDate || usage.subscriptionStatus !== 'active') {
        return {
          isExpired: false,
          daysUntilExpiry: 0,
          needsRenewal: false
        };
      }

      const now = new Date();
      const billingDate = new Date(usage.nextBillingDate);
      const daysUntilExpiry = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const isExpired = daysUntilExpiry <= 0;
      const needsRenewal = daysUntilExpiry <= 7; // Renew 7 days before expiry

      return {
        isExpired,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        needsRenewal
      };
    } catch (error) {
      console.error(`Error checking subscription expiry for user ${userId}:`, error);
      return {
        isExpired: true,
        daysUntilExpiry: 0,
        needsRenewal: false
      };
    }
  }

  /**
   * Get subscription status with billing info
   */
  async getSubscriptionStatus(userId: number): Promise<{
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    planId?: string;
    billingCycle?: string;
    nextBillingDate?: Date;
    daysUntilExpiry?: number;
  }> {
    try {
      const usage = await db.getUserUsage(userId);
      const expiryInfo = await this.checkSubscriptionExpiry(userId);

      let status: 'active' | 'inactive' | 'cancelled' | 'expired' = usage.subscriptionStatus as any;
      
      if (expiryInfo.isExpired && usage.subscriptionStatus === 'active') {
        status = 'expired';
      }

      return {
        status,
        planId: usage.planId,
        billingCycle: usage.billingCycle,
        nextBillingDate: usage.nextBillingDate,
        daysUntilExpiry: expiryInfo.daysUntilExpiry
      };
    } catch (error) {
      console.error(`Error getting subscription status for user ${userId}:`, error);
      return {
        status: 'inactive'
      };
    }
  }

  /**
   * Calculate next billing date based on cycle
   */
  private calculateNextBillingDate(currentDate: Date, billingCycle: 'monthly' | 'yearly'): Date {
    const nextDate = new Date(currentDate);
    
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return nextDate;
  }

  /**
   * Process expired subscriptions (called by cron job)
   */
  async processExpiredSubscriptions(): Promise<{
    processed: number;
    expired: number;
    renewed: number;
  }> {
    console.log('Processing expired subscriptions...');
    
    // This would need to be implemented with a proper query
    // For now, we'll return mock data
    return {
      processed: 0,
      expired: 0,
      renewed: 0
    };
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();
