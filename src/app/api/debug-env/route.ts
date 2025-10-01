import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  });
}

