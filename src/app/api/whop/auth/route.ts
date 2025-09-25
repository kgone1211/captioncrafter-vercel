import { NextRequest, NextResponse } from 'next/server';
import { validateWhopUser } from '@/lib/whop';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate user with Whop
    const whopUser = await validateWhopUser(userId);
    
    if (!whopUser) {
      return NextResponse.json(
        { error: 'Invalid user or no active subscription' },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: whopUser.id,
        email: whopUser.email,
        company_id: whopUser.company_id,
        subscription_status: whopUser.subscription_status
      }
    });

  } catch (error) {
    console.error('Whop auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  console.log('Whop auth request for user:', userId);

  if (!userId) {
    console.log('No user ID provided');
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Validating Whop user:', userId);
    const whopUser = await validateWhopUser(userId);
    
    if (!whopUser) {
      console.log('Whop user validation failed for:', userId);
      return NextResponse.json(
        { error: 'Invalid user or no active subscription' },
        { status: 401 }
      );
    }

    console.log('Whop user validated successfully:', whopUser.email);
    return NextResponse.json({
      success: true,
      user: {
        id: whopUser.id,
        email: whopUser.email,
        company_id: whopUser.company_id,
        subscription_status: whopUser.subscription_status
      }
    });

  } catch (error) {
    console.error('Whop auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
