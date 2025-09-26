'use client';

import { useState } from 'react';
import { WhopUser } from '@/lib/whop-sdk';

interface PaywallProps {
  whopUser: WhopUser;
  onUpgrade?: () => void;
}

export default function Paywall({ whopUser, onUpgrade }: PaywallProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string, planName: string) => {
    setIsLoading(planId);
    try {
      // Create Whop checkout URL with the specific plan
      const whopCompanyUrl = process.env.NEXT_PUBLIC_WHOP_COMPANY_URL || 'https://whop.com/your-company';
      const checkoutUrl = `${whopCompanyUrl}/checkout/${planId}`;
      
      console.log(`Redirecting to ${planName} checkout:`, checkoutUrl);
      window.open(checkoutUrl, '_blank');
      
      if (onUpgrade) {
        onUpgrade();
      }
    } catch (error) {
      console.error('Error redirecting to upgrade:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Caption Crafter</h1>
          <p className="text-lg text-gray-600">Unlock the full power of AI-generated captions</p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {whopUser.username?.charAt(0).toUpperCase() || whopUser.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Welcome, {whopUser.username || whopUser.email.split('@')[0]}!
              </h3>
              <p className="text-sm text-gray-500">{whopUser.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Usage Status</h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Free Trial
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 font-medium">Free Trial Complete</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              You've used all 10 free captions. Upgrade to continue generating unlimited captions.
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What You'll Get</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Caption Generation</h3>
                <p className="text-sm text-gray-600">Generate engaging captions for any platform</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Content Calendar</h3>
                <p className="text-sm text-gray-600">Schedule and manage your posts</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Caption Library</h3>
                <p className="text-sm text-gray-600">Save and organize your best captions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Multi-Platform Support</h3>
                <p className="text-sm text-gray-600">Instagram, TikTok, LinkedIn, and more</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic Plan */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Basic Plan</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">$19/month</div>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• 100 captions per month</li>
                <li>• Basic AI generation</li>
                <li>• 3 platforms</li>
                <li>• Email support</li>
              </ul>
              <button
                onClick={() => handleUpgrade('prod_OAeju0utHppI2', 'Basic Plan')}
                disabled={isLoading === 'prod_OAeju0utHppI2'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'prod_OAeju0utHppI2' ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting...
                  </div>
                ) : (
                  'Choose Basic'
                )}
              </button>
            </div>
            
            {/* Premium Plan */}
            <div className="border border-blue-500 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Premium Plan</h3>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Popular</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">$39/month</div>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Unlimited captions</li>
                <li>• Advanced AI features</li>
                <li>• All platforms</li>
                <li>• Priority support</li>
                <li>• Content calendar</li>
              </ul>
              <button
                onClick={() => handleUpgrade('prod_xcU9zERSGgyNK', 'Premium Plan')}
                disabled={isLoading === 'prod_xcU9zERSGgyNK'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'prod_xcU9zERSGgyNK' ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting...
                  </div>
                ) : (
                  'Choose Premium'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Secure payment processing powered by Whop
          </p>
        </div>
      </div>
    </div>
  );
}
