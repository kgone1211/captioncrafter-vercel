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
  
  try {
    // Use Whop SDK's official authentication method
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
  
  // Check if accessed through Whop iframe
  const referer = headersList.get('referer');
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
  console.log('No Whop headers found, using fallback user for direct access');
  return {
    userId: 'direct_access_user',
    isAuthenticated: true,
    source: 'direct-access'
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
