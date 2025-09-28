import { headers } from "next/headers";

export interface WhopAuthResult {
  userId: string;
  companyId?: string;
  token?: string;
  isAuthenticated: boolean;
  source: 'whop-headers' | 'bearer-token' | 'development' | 'direct-access' | 'url-params' | 'none';
}

/**
 * Extract user ID from URL parameters
 * This is used when Whop passes user info via URL params instead of headers
 */
function getUserIdFromUrl(): string | null {
  if (typeof window === 'undefined') {
    // Server-side: we can't access URL params here, return null
    return null;
  }
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check various possible parameter names that Whop might use
    const possibleParams = [
      'user_id',
      'whop_user_id', 
      'userId',
      'whopUserId',
      'user',
      'whop_user',
      'uid',
      'whop_uid'
    ];
    
    for (const param of possibleParams) {
      const value = urlParams.get(param);
      if (value && value.trim()) {
        console.log(`Found user ID from URL param '${param}':`, value);
        return value.trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user ID from URL:', error);
    return null;
  }
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
  
  // Method 1: Direct Whop user ID header (most reliable)
  if (whopUserId) {
    console.log('Found Whop user ID:', whopUserId);
    return {
      userId: whopUserId,
      companyId: whopCompanyId || undefined,
      token: whopToken || undefined,
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
  
  // Method 4: Check for any Whop-related headers (exclude common browser headers)
  const whopRelatedHeaders = Object.keys(allHeaders).filter(key => {
    const lowerKey = key.toLowerCase();
    return (lowerKey.startsWith('x-whop') || lowerKey.startsWith('whop-')) && 
           lowerKey !== 'user-agent' &&
           lowerKey !== 'accept' &&
           lowerKey !== 'host' &&
           lowerKey !== 'connection' &&
           lowerKey !== 'forwarded' &&
           lowerKey !== 'cache' &&
           lowerKey !== 'upgrade';
  });
  
  if (whopRelatedHeaders.length > 0) {
    console.log('Found Whop-related headers:', whopRelatedHeaders);
    // If we have any Whop-related headers, try to extract user info
    // But exclude common browser headers that might contain 'user' in their name
    const userIdFromHeaders = whopRelatedHeaders.find(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes('user') && 
             lowerKey !== 'user-agent' &&
             lowerKey !== 'accept' &&
             lowerKey !== 'host' &&
             lowerKey !== 'connection' &&
             lowerKey !== 'forwarded' &&
             lowerKey !== 'cache' &&
             lowerKey !== 'upgrade' &&
             allHeaders[key];
    });
    
    if (userIdFromHeaders) {
      return {
        userId: allHeaders[userIdFromHeaders],
        isAuthenticated: true,
        source: 'whop-headers'
      };
    }
  }
  
  // Method 5: Check URL parameters for user ID (production fallback)
  // This is useful when Whop passes user info via URL params instead of headers
  const urlUserId = getUserIdFromUrl();
  if (urlUserId) {
    console.log('Found user ID from URL parameters:', urlUserId);
    return {
      userId: urlUserId,
      isAuthenticated: true,
      source: 'url-params'
    };
  }

  // Only use test user in development mode for local testing
  if (process.env.NODE_ENV === 'development' && process.env.WHOP_DEV_MODE === 'true') {
    const testUsername = process.env.TEST_USERNAME || 'Krista';
    console.log('Development mode: Using test user:', testUsername);
    return {
      userId: `dev_user_${testUsername.toLowerCase()}`,
      isAuthenticated: true,
      source: 'development'
    };
  }
  
  // Method 6: Check if accessed through Whop iframe
  if (referer && (referer?.includes('whop.com') || referer?.includes('whop.io'))) {
    // If accessed through Whop but no auth headers, this is an error
    console.log('Accessed through Whop but no auth headers found - this should not happen');
    return {
      userId: '',
      isAuthenticated: false,
      source: 'none'
    };
  }
  
  // For direct access (not through Whop), provide a fallback user
  // This allows the app to work when accessed directly for testing/demo purposes
  console.log('No Whop headers found, using fallback user for direct access');
  return {
    userId: 'direct_access_user',
    isAuthenticated: true,
    source: 'direct-access'
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
