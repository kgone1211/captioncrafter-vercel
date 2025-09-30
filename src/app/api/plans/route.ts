import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return your actual Whop access pass plans
    const plans = [
      {
        id: 'prod_OAeju0utHppI2', // Basic Plan Access Pass ID
        name: 'Basic Plan',
        price: 19.99,
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
        id: 'prod_xcU9zERSGgyNK', // Premium Plan Access Pass ID
        name: 'Premium Plan',
        price: 39.99,
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
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
