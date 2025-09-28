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
      
      // Check if this is an OAuth authorization code
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      
      if (authCode) {
        console.log('Client-side: Processing OAuth authorization code:', authCode);
        
        // Exchange authorization code for user data
        fetch('/api/oauth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: authCode,
            clientId: process.env.NEXT_PUBLIC_WHOP_CLIENT_ID,
            clientSecret: process.env.WHOP_CLIENT_SECRET,
            redirectUri: window.location.origin
          })
        })
        .then(response => response.json())
        .then(async (result) => {
          if (result.user) {
            console.log('Client-side: OAuth exchange successful:', result);
            setWhopUser(result.user);
            setAuth({
              userId: result.user.id,
              isAuthenticated: true,
              source: 'url-params'
            });
            
            // Update database with new user via API call
            try {
              const dbResponse = await fetch('/api/user/upsert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: result.user.email,
                  whopUserId: result.user.id,
                  subscriptionStatus: result.user.subscription_status || 'inactive',
                  username: result.user.username
                })
              });
              
              if (dbResponse.ok) {
                const dbResult = await dbResponse.json();
                const newDbUserId = dbResult.userId;
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
                setDbUserId(fallbackDbUserId);
                setCanGenerate(fallbackCanGenerate);
              }
            } catch (dbError) {
              console.error('Client-side: Database error:', dbError);
              setDbUserId(fallbackDbUserId);
              setCanGenerate(fallbackCanGenerate);
            }
          } else {
            console.error('Client-side: OAuth exchange failed:', result);
            // Keep fallback values
          }
        })
        .catch((error) => {
          console.error('Client-side: OAuth error:', error);
          // Keep fallback values
        })
        .finally(() => {
          setLoading(false);
        });
      } else {
        // Regular user ID from URL params
        console.log('Client-side: Found user ID from URL params:', clientAuth.userId);
        
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
