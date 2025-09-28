import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Frontend debug test',
      instructions: [
        "1. Open your app in the browser",
        "2. Open browser console (F12)",
        "3. Look for 'UsageCounter loading usage for userId:' logs",
        "4. Check what userId is being used",
        "5. Try to generate a caption and see if paywall appears",
        "6. If paywall doesn't appear, check console for errors"
      ],
      testSteps: [
        "Check browser console for userId logs",
        "Verify UsageCounter shows correct count",
        "Try generating a caption",
        "Check if paywall appears on 4th attempt"
      ]
    });
  } catch (error) {
    console.error('Frontend debug error:', error);
    return NextResponse.json(
      { error: 'Frontend debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
