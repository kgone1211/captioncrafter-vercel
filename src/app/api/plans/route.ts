import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET() {
  try {
    const plans = await whopSdk.getSubscriptionPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
