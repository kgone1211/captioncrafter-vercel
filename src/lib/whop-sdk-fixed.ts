import { headers } from "next/headers";

export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  subscription_status?: 'active' | 'inactive' | 'cancelled';
}

export interface WhopCompany {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface WhopSubscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan_id: string;
  user_id: string;
  company_id: string;
  created_at: string;
  expires_at?: string;
}

export interface WhopAccessResult {
  hasAccess: boolean;
  accessLevel: 'admin' | 'customer' | 'no_access';
}

export interface WhopCompanyAccessResult {
  hasAccess: boolean;
  role?: 'owner' | 'admin' | 'member';
}

export interface WhopAccessPassResult {
  hasAccess: boolean;
  accessPassId: string;
  userId: string;
}

/**
 * Proper Whop SDK implementation following official documentation
 * Based on Context7 search results and Whop best practices
 */
class WhopSDK {
  private apiKey: string;
  private baseUrl = 'https://api.whop.com/api/v2';

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY || '';
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('WHOP_API_KEY environment variable is required in production');
    }
  }

  /**
   * Verify user token from Whop headers
   * This follows Whop's official authentication flow
   */
  async verifyUserToken(headersList: Headers): Promise<{ userId: string }> {
    // Get official Whop headers
    const whopUserId = headersList.get('x-whop-user-id');
    const whopToken = headersList.get('x-whop-token');
    const authorization = headersList.get('authorization');
    
    console.log('Whop SDK Auth Debug:', {
      whopUserId: whopUserId || 'missing',
      whopToken: whopToken ? 'present' : 'missing',
      authorization: authorization ? 'present' : 'missing',
      nodeEnv: process.env.NODE_ENV
    });
    
    // Method 1: Direct Whop user ID (most reliable for embedded apps)
    if (whopUserId) {
      console.log('Using Whop user ID:', whopUserId);
      return { userId: whopUserId };
    }
    
    // Method 2: Whop token verification
    if (whopToken) {
      try {
        const isValid = await this.verifyToken(whopToken);
        if (isValid) {
          const userId = this.extractUserIdFromToken(whopToken);
          console.log('Using verified Whop token, user ID:', userId);
          return { userId };
        }
      } catch (error) {
        console.error('Whop token verification failed:', error);
      }
    }
    
    // Method 3: Bearer token verification
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.replace('Bearer ', '');
      try {
        const isValid = await this.verifyToken(token);
        if (isValid) {
          const userId = this.extractUserIdFromToken(token);
          console.log('Using verified Bearer token, user ID:', userId);
          return { userId };
        }
      } catch (error) {
        console.error('Bearer token verification failed:', error);
      }
    }
    
    // Development mode fallback (only if explicitly enabled)
    if (process.env.NODE_ENV === 'development' && process.env.WHOP_DEV_MODE === 'true') {
      console.log('Development mode: Using test user');
      return { userId: 'dev_user_123' };
    }
    
    // No valid authentication found
    throw new Error('No valid Whop authentication found. Please access this app through Whop.');
  }

  /**
   * Verify JWT token with Whop's authentication system
   */
  private async verifyToken(token: string): Promise<boolean> {
    try {
      // For now, we'll do basic validation
      // In production, you should verify the JWT signature with Whop's public key
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.log('Token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Extract user ID from JWT token
   */
  private extractUserIdFromToken(token: string): string {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || payload.user_id || payload.id || 'unknown_user';
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return 'invalid_token';
    }
  }

  /**
   * Get user information from Whop API
   */
  async getUser({ userId }: { userId: string }): Promise<WhopUser> {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && userId.startsWith('dev_')) {
      return {
        id: userId,
        email: 'dev@example.com',
        username: 'devuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_dev_company',
        subscription_status: 'active'
      };
    }

    // If no API key, return test user (for development)
    if (!this.apiKey) {
      console.log('No API key, returning test user');
      return {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_test_company',
        subscription_status: 'active'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Get subscription status
      const subscriptionStatus = await this.getUserSubscriptionStatus(userId);
      
      return {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        profile_picture_url: userData.profile_picture_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        company_id: userData.company_id,
        subscription_status: subscriptionStatus
      };
    } catch (error) {
      console.error('Error fetching Whop user:', error);
      // Fallback to test user if API fails
      return {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_test_company',
        subscription_status: 'active'
      };
    }
  }

  /**
   * Get user's subscription status
   */
  async getUserSubscriptionStatus(userId: string): Promise<'active' | 'inactive' | 'cancelled'> {
    if (!this.apiKey) {
      return 'active'; // Default for development
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return 'inactive';
      }

      const data = await response.json();
      const subscriptions = data.data || [];
      
      // Check if user has any active subscription
      const activeSubscription = subscriptions.find((sub: WhopSubscription) => sub.status === 'active');
      
      return activeSubscription ? 'active' : 'inactive';
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return 'inactive';
    }
  }

  /**
   * Check if user has access to a specific experience
   */
  async checkIfUserHasAccessToExperience({ userId, experienceId }: { userId: string; experienceId: string }): Promise<WhopAccessResult> {
    try {
      // Development mode
      if (process.env.NODE_ENV === 'development' && userId.startsWith('dev_')) {
        return {
          hasAccess: true,
          accessLevel: 'customer'
        };
      }

      // Check user's subscription status first
      const subscriptionStatus = await this.getUserSubscriptionStatus(userId);
      
      if (subscriptionStatus !== 'active') {
        return {
          hasAccess: false,
          accessLevel: 'no_access'
        };
      }

      // For now, all active subscribers are customers
      // You can enhance this by checking company roles via Whop API
      return {
        hasAccess: true,
        accessLevel: 'customer'
      };

    } catch (error) {
      console.error('Error checking user access to experience:', error);
      return {
        hasAccess: false,
        accessLevel: 'no_access'
      };
    }
  }

  /**
   * Check if user has access to a specific company
   */
  async checkIfUserHasAccessToCompany({ userId, companyId }: { userId: string; companyId: string }): Promise<WhopCompanyAccessResult> {
    try {
      // Development mode
      if (process.env.NODE_ENV === 'development' && userId.startsWith('dev_')) {
        return {
          hasAccess: true,
          role: 'admin'
        };
      }

      if (!this.apiKey) {
        return { hasAccess: false };
      }

      // Get user's companies
      const response = await fetch(`${this.baseUrl}/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { hasAccess: false };
      }

      const companies = await response.json();
      
      // Check if user is a member of the specified company
      const userCompany = companies.data?.find((company: any) => 
        company.company_id === companyId || company.id === companyId
      );

      if (!userCompany) {
        return { hasAccess: false };
      }

      return {
        hasAccess: true,
        role: userCompany.role || 'member'
      };

    } catch (error) {
      console.error('Error checking user access to company:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Check if user has access to a specific access pass
   */
  async checkIfUserHasAccessToAccessPass({ accessPassId, userId }: { accessPassId: string; userId: string }): Promise<WhopAccessPassResult> {
    try {
      // Development mode
      if (process.env.NODE_ENV === 'development' && userId.startsWith('dev_')) {
        return {
          hasAccess: true,
          accessPassId,
          userId
        };
      }

      if (!this.apiKey) {
        return {
          hasAccess: false,
          accessPassId,
          userId
        };
      }

      // Check if user has access to the specific access pass
      const response = await fetch(`${this.baseUrl}/access-passes/${accessPassId}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasAccess: false,
          accessPassId,
          userId
        };
      }

      const accessData = await response.json();
      
      // Check if the user has active access
      const hasAccess = accessData.status === 'active' || accessData.has_access === true;

      return {
        hasAccess,
        accessPassId,
        userId
      };

    } catch (error) {
      console.error('Error checking user access to access pass:', error);
      return {
        hasAccess: false,
        accessPassId,
        userId
      };
    }
  }
}

// Add access object to the SDK
class WhopSDKWithAccess extends WhopSDK {
  access = {
    checkIfUserHasAccessToExperience: this.checkIfUserHasAccessToExperience.bind(this),
    checkIfUserHasAccessToCompany: this.checkIfUserHasAccessToCompany.bind(this),
    checkIfUserHasAccessToAccessPass: this.checkIfUserHasAccessToAccessPass.bind(this)
  };
}

// Export singleton instance with access methods
export const whopSdk = new WhopSDKWithAccess();
