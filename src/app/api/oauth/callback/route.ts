import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, clientId, clientSecret, redirectUri } = await request.json();

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      );
    }

    console.log('OAuth token exchange request:', { code, clientId, redirectUri });

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.whop.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth token exchange failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for token' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('OAuth token exchange successful');

    // Get user data with the access token
    const userResponse = await fetch('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user data');
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();
    console.log('User data fetched:', userData);

    return NextResponse.json({
      accessToken: tokenData.access_token,
      user: userData
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
