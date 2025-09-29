import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== WEBHOOK TEST RECEIVED ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');
    
    return NextResponse.json({
      success: true,
      message: 'Webhook test received successfully',
      timestamp: new Date().toISOString(),
      receivedData: body
    });
    
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook test' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint is ready',
    timestamp: new Date().toISOString(),
    instructions: 'Send a POST request to this endpoint to test webhook functionality'
  });
}
