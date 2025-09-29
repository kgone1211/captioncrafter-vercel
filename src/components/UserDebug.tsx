'use client';

import { useState, useEffect } from 'react';
import { WhopUser } from '@/lib/whop-sdk';

interface UserDebugProps {
  whopUser: WhopUser;
}

export default function UserDebug({ whopUser }: UserDebugProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or if explicitly enabled
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      window.location.search.includes('debug=true');
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-900">User Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div><strong>User ID:</strong> {whopUser.id}</div>
        <div><strong>Email:</strong> {whopUser.email}</div>
        <div><strong>Username:</strong> {whopUser.username || 'Not set'}</div>
        <div><strong>Company ID:</strong> {whopUser.company_id || 'Not set'}</div>
        <div><strong>Subscription:</strong> {whopUser.subscription_status || 'Not set'}</div>
        <div><strong>Created:</strong> {new Date(whopUser.created_at).toLocaleDateString()}</div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <p>This debug info helps identify where the email is coming from.</p>
        <p>If you see a generated email, it means Whop didn't provide real user data.</p>
      </div>
    </div>
  );
}
