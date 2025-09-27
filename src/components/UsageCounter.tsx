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
      const response = await fetch(`/api/usage?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('UsageCounter received data:', data);
        setUsage(data);
      } else {
        console.error('UsageCounter API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
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

  const remainingFree = Math.max(0, 10 - usage.freeCaptionsUsed);
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
