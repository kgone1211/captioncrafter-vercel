'use client';

import { useEffect, useState } from 'react';
import { WhopUser } from "@/lib/whop-sdk";
import { getWhopAuthClient, WhopAuthResult } from "@/lib/whop-auth-client";
import HomeClientPage from '../app/home-client';
import Paywall from '@/components/Paywall';

interface ClientAuthWrapperProps {
  fallbackAuth: WhopAuthResult;
  fallbackWhopUser: WhopUser;
  fallbackDbUserId: number;
  fallbackCanGenerate: boolean;
}

export default function ClientAuthWrapper({ 
  fallbackAuth, 
  fallbackWhopUser, 
  fallbackDbUserId, 
  fallbackCanGenerate 
}: ClientAuthWrapperProps) {
  const [auth, setAuth] = useState<WhopAuthResult>(fallbackAuth);
  const [whopUser, setWhopUser] = useState<WhopUser>(fallbackWhopUser);
  const [dbUserId, setDbUserId] = useState<number>(fallbackDbUserId);
  const [canGenerate, setCanGenerate] = useState<boolean>(fallbackCanGenerate);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check for URL parameters on client side
    const clientAuth = getWhopAuthClient();
    
    // If we found URL params, use them instead of server-side auth
    if (clientAuth.source === 'url-params' && clientAuth.userId !== fallbackAuth.userId) {
      console.log('Client-side: Found different user ID from URL params:', clientAuth.userId);
      setLoading(true);
      
      // Fetch user data from Whop API via server endpoint
      fetch(`/api/user/get?userId=${clientAuth.userId}`)
        .then(response => response.json())
        .then(async (user) => {
          console.log('Client-side: Fetched user from API:', user);
          setWhopUser(user);
          setAuth(clientAuth);
          
          // Update database with new user via API call
          try {
            const response = await fetch('/api/user/upsert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                whopUserId: user.id,
                subscriptionStatus: user.subscription_status,
                username: user.username
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              const newDbUserId = result.userId;
              setDbUserId(newDbUserId);
              
              // Check if user can generate captions via API call
              const canGenResponse = await fetch(`/api/user/can-generate?userId=${newDbUserId}`);
              if (canGenResponse.ok) {
                const canGenResult = await canGenResponse.json();
                setCanGenerate(canGenResult.canGenerate);
              } else {
                setCanGenerate(fallbackCanGenerate);
              }
            } else {
              // Use fallback values if API fails
              setDbUserId(fallbackDbUserId);
              setCanGenerate(fallbackCanGenerate);
            }
          } catch (dbError) {
            console.error('Client-side: API error:', dbError);
            // Use fallback values
            setDbUserId(fallbackDbUserId);
            setCanGenerate(fallbackCanGenerate);
          }
        })
        .catch((error) => {
          console.error('Client-side: Error fetching user:', error);
          // Keep fallback values
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [fallbackAuth, fallbackWhopUser, fallbackDbUserId, fallbackCanGenerate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Authenticating with Whop...
          </p>
        </div>
      </div>
    );
  }

  // If user can't generate captions (hit limit), show paywall
  if (!canGenerate) {
    console.log('Client-side: Showing paywall for user:', whopUser);
    return <Paywall whopUser={whopUser} dbUserId={dbUserId} />;
  }

  // If user can generate captions, show the app
  console.log('Client-side: Showing main app for user:', whopUser);
  return <HomeClientPage whopUser={whopUser} dbUserId={dbUserId} />;
}
