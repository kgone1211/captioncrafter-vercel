import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk-official';

export async function GET() {
  try {
    // For now, return fallback plans since the official SDK doesn't have getSubscriptionPlans
    // In a real implementation, you'd fetch plans from Whop's API
    const fallbackPlans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        interval: 'month',
        description: 'Perfect for individuals getting started',
        features: [
          'Unlimited caption generation',
          'All platforms supported',
          'Basic scheduling',
          'Email support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        interval: 'month',
        description: 'Advanced features for power users',
        features: [
          'Everything in Basic',
          'Advanced AI features',
          'Smart scheduling',
          'Priority support',
          'Analytics dashboard',
          'Team collaboration'
        ]
      }
    ];
    
    return NextResponse.json(fallbackPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
