import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // If no userId provided, try to get it from headers (for Whop requests)
    let actualUserId = userId;
    if (!actualUserId) {
      const headersList = request.headers;
      const whopUserId = headersList.get('x-whop-user-id');
      actualUserId = whopUserId || '1'; // Fallback to 1 only if no other option
    }
    
    // Test the generate API to see if it triggers the paywall
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'instagram',
        topic: 'test',
        tone: 'Authority',
        length: 'medium',
        num_variants: 5,
        keywords: '',
        cta: '',
        description: '',
        include_emojis: true,
        userId: parseInt(actualUserId)
      })
    });
    
    const testResult = await testResponse.json();
    
    return NextResponse.json({
      success: true,
      userId: parseInt(actualUserId),
      generateApiStatus: testResponse.status,
      generateApiResponse: testResult,
      shouldShowPaywall: testResponse.status === 403 && testResult.canGenerate === false,
      instructions: [
        "1. If 'shouldShowPaywall' is true, the API is working correctly",
        "2. The paywall should appear when you try to generate a caption",
        "3. If paywall doesn't show, check browser console for errors",
        "4. Try clicking the 'Generate Captions' button in the app"
      ]
    });
  } catch (error) {
    console.error('Debug paywall test error:', error);
    return NextResponse.json(
      { error: 'Debug paywall test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
