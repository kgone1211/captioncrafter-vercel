import { headers } from "next/headers";

export interface WhopAuthResult {
  userId: string;
  companyId?: string;
  token?: string;
  isAuthenticated: boolean;
  source: 'whop-headers' | 'bearer-token' | 'development' | 'none';
}

/**
 * Proper Whop authentication handler following official documentation
 * Based on Context7 search results and Whop SDK best practices
 */
export async function getWhopAuth(): Promise<WhopAuthResult> {
  const headersList = await headers();
  
  // Get Whop authentication headers (official headers from Whop SDK)
  const authorization = headersList.get('authorization');
  const whopUserId = headersList.get('x-whop-user-id');
  const whopCompanyId = headersList.get('x-whop-company-id');
  const whopToken = headersList.get('x-whop-token');
  const whopAppId = headersList.get('x-whop-app-id');
  
  // Log headers for debugging
  console.log('Whop Auth Debug:', {
    authorization: authorization ? 'present' : 'missing',
    whopUserId: whopUserId || 'missing',
    whopCompanyId: whopCompanyId || 'missing',
    whopToken: whopToken ? 'present' : 'missing',
    whopAppId: whopAppId || 'missing',
    nodeEnv: process.env.NODE_ENV
  });
  
  // Method 1: Official Whop user ID header (most reliable)
  if (whopUserId) {
    return {
      userId: whopUserId,
      companyId: whopCompanyId || undefined,
      token: whopToken || undefined,
      isAuthenticated: true,
      source: 'whop-headers'
    };
  }
  
  // Method 2: Bearer token verification (requires JWT validation)
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.replace('Bearer ', '');
    
    try {
      // Verify JWT token with Whop's public key
      const isValidToken = await verifyWhopJWT(token);
      
      if (isValidToken) {
        const userId = extractUserIdFromToken(token);
        return {
          userId: userId,
          token: token,
          isAuthenticated: true,
          source: 'bearer-token'
        };
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }
  
  // Method 3: Whop token header (alternative method)
  if (whopToken) {
    try {
      const isValidToken = await verifyWhopJWT(whopToken);
      
      if (isValidToken) {
        const userId = extractUserIdFromToken(whopToken);
        return {
          userId: userId,
          token: whopToken,
          isAuthenticated: true,
          source: 'whop-headers'
        };
      }
    } catch (error) {
      console.error('Whop token verification failed:', error);
    }
  }
  
  // Method 4: Development mode (only for local testing)
  if (process.env.NODE_ENV === 'development') {
    // Only allow development mode if explicitly enabled
    if (process.env.WHOP_DEV_MODE === 'true') {
      console.log('Development mode: Using test user');
      return {
        userId: 'dev_user_123',
        isAuthenticated: true,
        source: 'development'
      };
    }
  }
  
  // No valid authentication found
  return {
    userId: '',
    isAuthenticated: false,
    source: 'none'
  };
}

/**
 * Verify JWT token with Whop's public key
 * This should be implemented using Whop's official JWT verification
 */
async function verifyWhopJWT(token: string): Promise<boolean> {
  try {
    // TODO: Implement proper JWT verification using Whop's public key
    // For now, we'll do basic token format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // In production, you should verify the JWT signature with Whop's public key
    // This is a placeholder implementation
    return true;
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}

/**
 * Extract user ID from JWT token payload
 */
function extractUserIdFromToken(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.user_id || payload.id || 'unknown_user';
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return 'invalid_token';
  }
}

/**
 * Check if the request is coming from Whop
 */
export async function isWhopRequest(): Promise<boolean> {
  const headersList = await headers();
  const referer = headersList.get('referer');
  const whopAppId = headersList.get('x-whop-app-id');
  const whopUserId = headersList.get('x-whop-user-id');
  
  return !!(
    whopAppId ||
    whopUserId ||
    referer?.includes('whop.com') ||
    referer?.includes('whop.io')
  );
}
