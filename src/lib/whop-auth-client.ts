/**
 * Client-side Whop authentication handler
 * Handles URL parameter authentication for production use
 */

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
 * Client-side Whop authentication handler
 * Checks URL parameters for user authentication
 */
export function getWhopAuthClient(): WhopAuthResult {
  // Check URL parameters for user ID (production method)
  const urlUserId = getUserIdFromUrl();
  if (urlUserId) {
    console.log('Client-side: Found user ID from URL parameters:', urlUserId);
    return {
      userId: urlUserId,
      isAuthenticated: true,
      source: 'url-params'
    };
  }

  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development' && process.env.WHOP_DEV_MODE === 'true') {
    const testUsername = process.env.TEST_USERNAME || 'Krista';
    console.log('Client-side: Development mode: Using test user:', testUsername);
    return {
      userId: `dev_user_${testUsername.toLowerCase()}`,
      isAuthenticated: true,
      source: 'development'
    };
  }

  // Check if accessed through Whop iframe by looking at referrer
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.referrer) {
    const referrer = document.referrer;
    if (referrer.includes('whop.com') || referrer.includes('whop.io')) {
      console.log('Client-side: Accessed through Whop but no URL params found');
      return {
        userId: '',
        isAuthenticated: false,
        source: 'none'
      };
    }
  }

  // For direct access (not through Whop), provide a fallback user
  console.log('Client-side: No URL params found, using fallback user for direct access');
  return {
    userId: 'direct_access_user',
    isAuthenticated: true,
    source: 'direct-access'
  };
}

/**
 * Get user ID from URL parameters (utility function)
 */
export function getUserIdFromUrlParams(): string | null {
  return getUserIdFromUrl();
}
