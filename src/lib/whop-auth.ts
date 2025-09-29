import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";

export interface WhopAuthResult {
  userId: string;
  companyId?: string;
  token?: string;
  isAuthenticated: boolean;
  source: 'whop-headers' | 'bearer-token' | 'development' | 'direct-access' | 'url-params' | 'none';
}

/**
 * Enhanced Whop authentication handler
 * Uses Whop SDK's verifyUserToken method for proper authentication
 */
export async function getWhopAuth(): Promise<WhopAuthResult> {
  const headersList = await headers();
  
  // Log all headers for debugging
  const allHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });
  
  console.log('=== WHOP AUTH DEBUG ===');
  console.log('All headers:', allHeaders);
  console.log('Whop-specific headers:', {
    'x-whop-user-id': headersList.get('x-whop-user-id') || 'missing',
    'x-whop-company-id': headersList.get('x-whop-company-id') || 'missing',
    'x-whop-token': headersList.get('x-whop-token') ? 'present' : 'missing',
    'x-whop-app-id': headersList.get('x-whop-app-id') || 'missing',
    'authorization': headersList.get('authorization') ? 'present' : 'missing',
    'referer': headersList.get('referer') || 'missing',
  });
  
  try {
    // Use Whop SDK's official authentication method (for iframe apps)
    const { userId } = await whopSdk.verifyUserToken(headersList);
    
    if (userId) {
      console.log('Whop SDK authentication successful:', userId);
      return {
        userId: userId,
        isAuthenticated: true,
        source: 'whop-headers'
      };
    }
  } catch (error) {
    console.log('Whop SDK authentication failed:', error);
    console.log('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  // Check if this is a Whop OAuth redirect (Webapp experience)
  const referer = headersList.get('referer');
  const isFromWhop = referer && (referer.includes('whop.com') || referer.includes('whop.io'));
  
  console.log('Referer check:', { referer, isFromWhop });
  
      if (isFromWhop) {
        // If accessed through Whop but no auth headers, this could be:
        // 1. OAuth flow (will be handled by client-side)
        // 2. App configuration issue
        // 3. User not properly authenticated in Whop
        
        console.log('Accessed through Whop but no valid authentication found');
        // Don't provide fallback - require proper authentication
      }
  
  // Fallback: Check URL parameters for user ID (production method)
  const urlUserId = getUserIdFromUrl();
  if (urlUserId) {
    console.log('Found user ID from URL parameters:', urlUserId);
    return {
      userId: urlUserId,
      isAuthenticated: true,
      source: 'url-params'
    };
  }

  // No valid authentication found
  console.log('No valid Whop authentication found');
  return {
    userId: '',
    isAuthenticated: false,
    source: 'none'
  };
}

/**
 * Extract user ID from URL parameters (server-side)
 */
function getUserIdFromUrl(): string | null {
  // This would need to be implemented differently on server-side
  // For now, return null and rely on client-side detection
  return null;
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
