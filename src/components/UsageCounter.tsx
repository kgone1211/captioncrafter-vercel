'use client';

import { useState, useEffect } from 'react';
import { Zap, Crown } from 'lucide-react';

interface UsageCounterProps {
  userId: number;
  className?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function UsageCounter({ userId, className = '', refreshTrigger }: UsageCounterProps) {
  const [usage, setUsage] = useState<{ freeCaptionsUsed: number; subscriptionStatus: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [userId, refreshTrigger]); // Add refreshTrigger to dependencies

  const loadUsage = async () => {
    try {
      console.log('UsageCounter loading usage for userId:', userId);
      
      // Always try both APIs and use the higher count
      const [dbResponse, fallbackResponse] = await Promise.allSettled([
        fetch(`/api/usage?userId=${userId}`),
        fetch(`/api/fallback-usage?userId=${userId}`)
      ]);
      
      let dbUsage = null;
      let fallbackUsage = null;
      
      // Process database response
      if (dbResponse.status === 'fulfilled' && dbResponse.value.ok) {
        dbUsage = await dbResponse.value.json();
        console.log('Database usage:', dbUsage);
      } else {
        console.log('Database API failed or not available');
      }
      
      // Process fallback response
      if (fallbackResponse.status === 'fulfilled' && fallbackResponse.value.ok) {
        fallbackUsage = await fallbackResponse.value.json();
        console.log('Fallback usage:', fallbackUsage);
      } else {
        console.log('Fallback API failed or not available');
      }
      
      // Use the higher count between database and fallback
      if (dbUsage && fallbackUsage) {
        const higherCount = Math.max(dbUsage.freeCaptionsUsed, fallbackUsage.freeCaptionsUsed);
        const finalUsage = higherCount === fallbackUsage.freeCaptionsUsed ? fallbackUsage : dbUsage;
        console.log('Using higher count:', finalUsage);
        setUsage(finalUsage);
      } else if (fallbackUsage) {
        console.log('Using fallback counter (database unavailable)');
        setUsage(fallbackUsage);
      } else if (dbUsage) {
        console.log('Using database counter (fallback unavailable)');
        setUsage(dbUsage);
      } else {
        console.log('Both APIs failed, using default');
        setUsage({ freeCaptionsUsed: 0, subscriptionStatus: 'active' });
      }
      
    } catch (error) {
      console.error('Error loading usage:', error);
      setUsage({ freeCaptionsUsed: 0, subscriptionStatus: 'active' });
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
  // For now, everyone is on freemium model regardless of subscription status
  // TODO: In the future, check for actual paid subscription status
  const isSubscribed = false; // Disabled for now

  if (isSubscribed) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-green-600 ${className}`}>
        <Crown className="h-4 w-4" />
        <span>Unlimited</span>
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
