'use client';

import { useState, useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface UpgradeToPremiumProps {
  userId: number;
}

export default function UpgradeToPremium({ userId }: UpgradeToPremiumProps) {
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

  const handleUpgrade = () => {
    // Open Premium plan checkout in new tab
    const premiumCheckoutUrl = 'https://whop.com/checkout/plan_qbxMJNrDzxyfw/';
    window.open(premiumCheckoutUrl, '_blank');
  };

  // Only show upgrade button for Basic plan users (or active users without plan_id set)
  if (loading || subscriptionStatus !== 'active') {
    return null;
  }
  
  // If planId is set and it's not Basic, don't show (user is Premium)
  if (planId && planId !== 'plan_cs24bg68DSLES') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Upgrade to Premium</h3>
            <p className="text-sm text-gray-600">
              Unlock LinkedIn, YouTube, Threads, Telegram & advanced AI
            </p>
          </div>
        </div>
        
        <button
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 font-medium"
        >
          <Sparkles className="h-4 w-4" />
          <span>Upgrade Now</span>
        </button>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          <span>LinkedIn & YouTube</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          <span>Threads & Telegram</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          <span>Advanced AI</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          <span>Priority Support</span>
        </div>
      </div>
    </div>
  );
}
