'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`OAuth error: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code provided');
          return;
        }

        console.log('OAuth callback processing code:', code);

        // Exchange authorization code for user data
        const response = await fetch('/api/oauth/callback', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'OAuth callback failed');
        }

        const result = await response.json();
        console.log('OAuth callback successful:', result);

        if (result.success && result.user) {
          // Store user data in localStorage for the main app to use
          localStorage.setItem('whop_user_data', JSON.stringify(result.user));
          localStorage.setItem('whop_access_token', result.accessToken);
          
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to main app
          setTimeout(() => {
            router.push('/');
          }, 1000);
        } else {
          throw new Error('No user data received');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          {status === 'loading' && (
            <svg className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {status === 'success' && (
            <svg className="h-8 w-8 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Error'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to App
          </button>
        )}
      </div>
    </div>
  );
}
