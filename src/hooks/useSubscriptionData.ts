import { useState, useEffect } from 'react';

interface SubscriptionData {
  subscriptionStatus: string;
  planId: string | null;
  freeCaptionsUsed: number;
  loading: boolean;
  error: string | null;
}

export function useSubscriptionData(userId: number): SubscriptionData {
  const [data, setData] = useState<SubscriptionData>({
    subscriptionStatus: 'inactive',
    planId: null,
    freeCaptionsUsed: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch(`/api/usage?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subscription data: ${response.status}`);
        }
        
        const result = await response.json();
        
        setData({
          subscriptionStatus: result.subscriptionStatus || 'inactive',
          planId: result.planId || null,
          freeCaptionsUsed: result.freeCaptionsUsed || 0,
          loading: false,
          error: null
        });
        
        console.log('Subscription data fetched:', {
          subscriptionStatus: result.subscriptionStatus,
          planId: result.planId,
          freeCaptionsUsed: result.freeCaptionsUsed
        });
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    if (userId) {
      fetchSubscriptionData();
    }
  }, [userId]);

  return data;
}
