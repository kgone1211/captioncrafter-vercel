'use client';

import { useState, useEffect } from 'react';
import { Zap, Crown } from 'lucide-react';

interface UsageCounterProps {
  userId: number;
  className?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function UsageCounter({ userId, className = '', refreshTrigger }: UsageCounterProps) {
  const [usage, setUsage] = useState<{ 
    freeCaptionsUsed: number; 
    subscriptionStatus: string;
    planId?: string;
    billingCycle?: string;
    nextBillingDate?: Date;
    daysUntilExpiry?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [userId, refreshTrigger]); // Add refreshTrigger to dependencies

  const loadUsage = async () => {
    try {
      console.log('UsageCounter loading usage for userId:', userId);
      
      // Use the proper usage API
      const response = await fetch(`/api/usage?userId=${userId}`);
      console.log('Usage API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Usage data:', data);
        setUsage(data);
      } else {
        console.error('Usage API error:', response.status, response.statusText);
        setUsage({ freeCaptionsUsed: 0, subscriptionStatus: 'inactive' });
      }
      
    } catch (error) {
      console.error('Error loading usage:', error);
      setUsage({ freeCaptionsUsed: 0, subscriptionStatus: 'inactive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <Zap className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const remainingFree = Math.max(0, 3 - usage.freeCaptionsUsed);
  
  // Debug logging
  console.log('UsageCounter debug:', {
    usage,
    remainingFree,
    subscriptionStatus: usage.subscriptionStatus,
    freeCaptionsUsed: usage.freeCaptionsUsed
  });
  
  // Check if user has active subscription
  const hasActiveSubscription = usage.subscriptionStatus === 'active';
  
  // Check if subscription is expired (only for users who had an active subscription)
  const isExpired = hasActiveSubscription && usage.daysUntilExpiry !== undefined && usage.daysUntilExpiry <= 0;
  
  // Check if subscription needs renewal soon
  const needsRenewalSoon = hasActiveSubscription && usage.daysUntilExpiry !== undefined && usage.daysUntilExpiry <= 7;
  
  console.log('UsageCounter logic:', {
    hasActiveSubscription,
    isExpired,
    needsRenewalSoon,
    daysUntilExpiry: usage.daysUntilExpiry
  });

  if (hasActiveSubscription && !isExpired) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-green-600 ${className}`}>
        <Crown className="h-4 w-4" />
        <span>
          {needsRenewalSoon 
            ? `Renews in ${usage.daysUntilExpiry} days`
            : 'Unlimited'
          }
        </span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
        <Zap className="h-4 w-4" />
        <span>Subscription Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <Zap className="h-4 w-4" />
      <span className={remainingFree > 0 ? 'text-gray-600' : 'text-red-600'}>
        {remainingFree} free left
      </span>
    </div>
  );
}
