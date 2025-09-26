import { headers } from "next/headers";

export interface WhopAuthResult {
  userId: string;
  companyId?: string;
  token?: string;
  isAuthenticated: boolean;
  source: 'whop-headers' | 'bearer-token' | 'development' | 'none';
}

/**
 * Enhanced Whop authentication handler
 * Handles multiple authentication methods that Whop might use
 */
export async function getWhopAuth(): Promise<WhopAuthResult> {
  const headersList = await headers();
  
  // Get all possible authentication headers
  const authorization = headersList.get('authorization');
  const whopUserId = headersList.get('x-whop-user-id');
  const whopCompanyId = headersList.get('x-whop-company-id');
  const whopToken = headersList.get('x-whop-token');
  const whopAppId = headersList.get('x-whop-app-id');
  const referer = headersList.get('referer');
  const userAgent = headersList.get('user-agent');
  
  // Log all headers for debugging
  const allHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });
  
  console.log('All Headers:', allHeaders);
  console.log('Whop Auth Debug:', {
    authorization: authorization ? 'present' : 'missing',
    whopUserId: whopUserId || 'missing',
    whopCompanyId: whopCompanyId || 'missing',
    whopToken: whopToken ? 'present' : 'missing',
    whopAppId: whopAppId || 'missing',
    referer: referer || 'missing',
    userAgent: userAgent ? 'present' : 'missing',
    nodeEnv: process.env.NODE_ENV
  });
  
  // Method 1: Direct Whop user ID header
  if (whopUserId) {
    return {
      userId: whopUserId,
      companyId: whopCompanyId || undefined,
      isAuthenticated: true,
      source: 'whop-headers'
    };
  }
  
  // Method 2: Bearer token in authorization header
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.replace('Bearer ', '');
    return {
      userId: token, // Use token as user ID for now
      token: token,
      isAuthenticated: true,
      source: 'bearer-token'
    };
  }
  
  // Method 3: Whop token header
  if (whopToken) {
    return {
      userId: whopToken,
      token: whopToken,
      isAuthenticated: true,
      source: 'whop-headers'
    };
  }
  
  // Method 4: Check for any Whop-related headers (exclude user-agent and accept)
  const whopRelatedHeaders = Object.keys(allHeaders).filter(key => 
    (key.toLowerCase().includes('whop') || 
     key.toLowerCase().includes('auth')) &&
    !key.toLowerCase().includes('user-agent') &&
    !key.toLowerCase().includes('accept') &&
    !key.toLowerCase().includes('host') &&
    !key.toLowerCase().includes('connection')
  );
  
  if (whopRelatedHeaders.length > 0) {
    console.log('Found Whop-related headers:', whopRelatedHeaders);
    // If we have any Whop-related headers, try to extract user info
    const userIdFromHeaders = whopRelatedHeaders.find(key => 
      key.toLowerCase().includes('user') && allHeaders[key]
    );
    
    if (userIdFromHeaders) {
      return {
        userId: allHeaders[userIdFromHeaders],
        isAuthenticated: true,
        source: 'whop-headers'
      };
    }
  }
  
  // Method 5: Development mode fallback - use a proper test user
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Using test user');
    return {
      userId: 'test_user_123',
      isAuthenticated: true,
      source: 'development'
    };
  }
  
  // Method 5: Check if accessed through Whop iframe
  if (referer && (referer.includes('whop.com') || referer.includes('whop.io'))) {
    // If accessed through Whop but no auth headers, try to extract from URL or use session
    console.log('Accessed through Whop but no auth headers found');
    return {
      userId: 'whop_user_fallback',
      isAuthenticated: false,
      source: 'none'
    };
  }
  
  // No authentication found
  return {
    userId: '',
    isAuthenticated: false,
    source: 'none'
  };
}

/**
 * Check if the request is coming from Whop
 */
export async function isWhopRequest(): Promise<boolean> {
  const headersList = await headers();
  const referer = headersList.get('referer');
  const userAgent = headersList.get('user-agent');
  
  return !!(
    referer?.includes('whop.com') ||
    referer?.includes('whop.io') ||
    userAgent?.includes('Whop') ||
    headersList.get('x-whop-app-id')
  );
}
