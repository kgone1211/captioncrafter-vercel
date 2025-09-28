'use client';

import { useState } from 'react';
import { Crown, Lock, Check, X } from 'lucide-react';
import { getPlanFeatures, canAccessFeature, getAvailablePlatforms, PlanFeatures } from '@/lib/plan-features';

interface PlanAwareFeatureProps {
  subscriptionStatus: string;
  planId?: string;
  feature: keyof PlanFeatures['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanAwareFeature({ 
  subscriptionStatus, 
  planId, 
  feature, 
  children, 
  fallback 
}: PlanAwareFeatureProps) {
  const hasAccess = canAccessFeature(subscriptionStatus, planId, feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return fallback || (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
        <div className="bg-white p-3 rounded-lg shadow-lg flex items-center space-x-2">
          <Lock className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Upgrade Required</span>
        </div>
      </div>
    </div>
  );
}

interface PlanBadgeProps {
  subscriptionStatus: string;
  planId?: string;
}

export function PlanBadge({ subscriptionStatus, planId }: PlanBadgeProps) {
  const plan = getPlanFeatures(subscriptionStatus, planId);
  
  if (plan.id === 'free') {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Free Plan
      </div>
    );
  }
  
  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <Crown className="h-3 w-3 mr-1" />
      {plan.name}
    </div>
  );
}

interface PlanComparisonProps {
  currentPlan: PlanFeatures;
  onUpgrade?: (planId: string) => void;
}

export function PlanComparison({ currentPlan, onUpgrade }: PlanComparisonProps) {
  const plans = Object.values(PLAN_FEATURES).filter(p => p.id !== 'free');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan) => (
        <div 
          key={plan.id}
          className={`border rounded-lg p-4 ${
            currentPlan.id === plan.id 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <div className="text-right">
              <div className="text-2xl font-bold">${plan.price}</div>
              <div className="text-sm text-gray-500">/{plan.interval}</div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">
                {plan.features.captionLimit === 'unlimited' 
                  ? 'Unlimited captions' 
                  : `${plan.features.captionLimit} captions/month`}
              </span>
            </div>
            
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">
                {plan.features.platforms.length} platforms
              </span>
            </div>
            
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm capitalize">
                {plan.features.aiLevel} AI
              </span>
            </div>
            
            {plan.features.calendar && (
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Content Calendar</span>
              </div>
            )}
            
            {plan.features.analytics && (
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Analytics</span>
              </div>
            )}
            
            {plan.features.customPrompts && (
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Custom Prompts</span>
              </div>
            )}
          </div>
          
          {currentPlan.id !== plan.id && onUpgrade && (
            <button
              onClick={() => onUpgrade(plan.id)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Upgrade to {plan.name}
            </button>
          )}
          
          {currentPlan.id === plan.id && (
            <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center">
              Current Plan
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Import the PLAN_FEATURES from the plan-features file
import { PLAN_FEATURES } from '@/lib/plan-features';
