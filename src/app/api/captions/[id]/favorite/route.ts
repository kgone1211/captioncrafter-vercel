// API route for toggling caption favorite status

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const captionId = parseInt(id);
    
    if (!captionId) {
      return NextResponse.json(
        { error: 'Invalid caption ID' },
        { status: 400 }
      );
    }

    const db = new Database();
    const success = await db.toggleFavorite(captionId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
