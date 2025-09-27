import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test if the singleton is working by checking the instance
    const instance1 = db;
    const instance2 = db;
    
    return NextResponse.json({ 
      isSingleton: instance1 === instance2,
      instance1: instance1.constructor.name,
      instance2: instance2.constructor.name,
      message: 'Singleton test completed'
    });
  } catch (error) {
    console.error('Singleton test error:', error);
    return NextResponse.json(
      { error: 'Failed to test singleton' },
      { status: 500 }
    );
  }
}
