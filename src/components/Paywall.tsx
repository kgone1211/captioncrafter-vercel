'use client';

import { useState, useEffect } from 'react';
import { WhopUser } from '@/lib/whop-sdk';

interface PaywallProps {
  whopUser?: WhopUser;
  dbUserId?: number;
  userId?: number;
  onUpgrade?: () => void;
  onClose?: () => void;
}

export default function Paywall({ whopUser, dbUserId, userId, onUpgrade, onClose }: PaywallProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ freeCaptionsUsed: number; subscriptionStatus: string } | null>(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: whopUser?.username || 'User',
    email: whopUser?.email || 'user@example.com',
    plan: 'basic' // Default to basic plan, not premium
  });

  // Debug logging
  console.log('Paywall received whopUser:', whopUser);
  console.log('Paywall formData initialized with:', formData);
  console.log('Paywall state:', { 
    plansCount: plans.length 
  });

  useEffect(() => {
    loadUsage();
    loadPlans();
  }, [userId, dbUserId]);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const plansData = await response.json();
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  // Update form data when whopUser changes
  useEffect(() => {
    if (whopUser) {
      setFormData({
        name: whopUser.username || whopUser.email || '',
        email: whopUser.email || '',
        plan: 'basic' // Default to basic plan, not premium
      });
    }
  }, [whopUser]);

  const loadUsage = async () => {
    try {
      const targetUserId = userId || dbUserId;
      console.log('Paywall loadUsage called with targetUserId:', targetUserId);
      
      if (!targetUserId) {
        console.log('No targetUserId, skipping usage load');
        return;
      }
      
      console.log('Fetching usage from /api/usage?userId=' + targetUserId);
      const response = await fetch(`/api/usage?userId=${targetUserId}`);
      console.log('Usage API response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Paywall received usage data:', data);
        setUsage(data);
      } else {
        console.error('Failed to load usage:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading usage in Paywall:', error);
    }
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    console.log('handleUpgrade called with:', { planId, planName });
    
    // Find the selected plan
    const plan = plans.find(p => p.id === planId);
    console.log('Found plan:', plan);
    
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    console.log('Creating checkout session and redirecting to Whop...');
    
    try {
      // Create checkout session and redirect directly to Whop
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: userId || dbUserId || (whopUser?.id ? parseInt(whopUser.id.toString()) : 1),
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`
        })
      });

      console.log('Checkout API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout API error:', errorData);
        alert('Failed to create checkout session: ' + (errorData.error || 'Unknown error'));
        return;
      }

      const { checkoutUrl, sessionId } = await response.json();
      console.log('Received checkout URL:', checkoutUrl);
      
      // Redirect directly to Whop checkout page
      if (checkoutUrl) {
        console.log('Redirecting to Whop checkout:', checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error creating checkout session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };


  const handleSubscriptionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('form');
    
    try {
      console.log('Subscription form submitted:', formData);
      
      // Redirect to Whop checkout
      const planId = formData.plan === 'basic' ? 'prod_OAeju0utHppI2' : 'prod_xcU9zERSGgyNK';
      await handleUpgrade(planId, formData.plan === 'basic' ? 'Basic Plan' : 'Premium Plan');
    } catch (error) {
      console.error('Error processing subscription:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
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
                {(whopUser?.username || whopUser?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Welcome, {whopUser?.username || whopUser?.email?.split('@')[0] || 'User'}!
              </h3>
              <p className="text-sm text-gray-500">{whopUser?.email || 'user@example.com'}</p>
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
          
          {usage && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Captions Used</span>
                <span className="text-sm font-medium text-gray-900">
                  {usage.freeCaptionsUsed} / 3
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((usage.freeCaptionsUsed / 3) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800 font-medium">Free Trial Complete</p>
            </div>
            <p className="text-red-700 text-sm mt-1">
              You've used all 3 free captions. Upgrade to continue generating unlimited captions.
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

        {/* Subscription Options */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Choose Your Plan</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSubscriptionForm(false)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  !showSubscriptionForm 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quick Upgrade
              </button>
              <button
                onClick={() => setShowSubscriptionForm(true)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showSubscriptionForm 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Custom Form
              </button>
            </div>
          </div>

          {!showSubscriptionForm ? (
            <div className="grid md:grid-cols-2 gap-4">
              {plans.length > 0 ? (
                plans.map((plan, index) => (
                  <div 
                    key={plan.id} 
                    className={`border rounded-lg p-4 ${
                      index === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      {index === 1 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ${plan.price}/{plan.interval === 'month' ? 'month' : plan.interval === 'year' ? 'year' : 'one-time'}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      {plan.features.map((feature: string, featureIndex: number) => (
                        <li key={featureIndex}>• {feature}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade(plan.id, plan.name)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        index === 1 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading subscription plans...</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Subscription Form */}
        {showSubscriptionForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Subscription</h2>
            <form onSubmit={handleSubscriptionForm} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Plan
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.plan === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setFormData({ ...formData, plan: 'basic' })}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="plan"
                        value="basic"
                        checked={formData.plan === 'basic'}
                        onChange={() => setFormData({ ...formData, plan: 'basic' })}
                        className="mr-2"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Basic Plan</h3>
                        <p className="text-sm text-gray-600">$19/month - 100 captions</p>
                      </div>
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.plan === 'premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setFormData({ ...formData, plan: 'premium' })}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="plan"
                        value="premium"
                        checked={formData.plan === 'premium'}
                        onChange={() => setFormData({ ...formData, plan: 'premium' })}
                        className="mr-2"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Premium Plan</h3>
                        <p className="text-sm text-gray-600">$39/month - Unlimited captions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading === 'form'}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'form' ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Complete Subscription'
                )}
              </button>
            </form>
          </div>
        )}

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
