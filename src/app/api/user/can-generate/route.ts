import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    console.log('API: Checking if user can generate captions:', userIdNum);

    // Initialize database
    await db.initDatabase();

    // Check if user can generate captions
    const canGenerate = await db.canGenerateCaption(userIdNum);

    console.log('API: User can generate captions:', canGenerate);

    return NextResponse.json({ canGenerate });
  } catch (error) {
    console.error('API: Error checking if user can generate:', error);
    return NextResponse.json(
      { error: 'Failed to check if user can generate' },
      { status: 500 }
    );
  }
}
