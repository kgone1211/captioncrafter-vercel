// API route for individual scheduled post operations

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const db = new Database();
    const success = await db.deleteScheduledPost(postId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Delete scheduled post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
}
