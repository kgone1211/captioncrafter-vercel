'use client';

import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface SubscriptionPlanBadgeProps {
  userId: number;
}

export default function SubscriptionPlanBadge({ userId }: SubscriptionPlanBadgeProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive');
  const [planId, setPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch(`/api/usage?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data.subscriptionStatus || 'inactive');
          setPlanId(data.planId || '');
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
        Loading...
      </div>
    );
  }

  if (subscriptionStatus === 'active') {
    // Determine plan name based on plan ID
    let planName = 'Basic Plan'; // Default to Basic for active subscriptions
    if (planId === 'plan_qbxMJNrDzxyfw') {
      planName = 'Premium Plan';
    } else if (planId === 'plan_cs24bg68DSLES') {
      planName = 'Basic Plan';
    }
    // If planId is null but subscription is active, assume Basic Plan (since user paid)
    
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-2">
        <Crown className="h-3 w-3 mr-1" />
        {planName}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
      Free Plan
    </div>
  );
}
