import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching user:', userId);

    // Get user from Whop SDK (server-side)
    const user = await whopSdk.getUser({ userId });

    console.log('API: User fetched:', user);

    return NextResponse.json(user);
  } catch (error) {
    console.error('API: Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
