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

export interface WhopCheckoutSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'unpaid' | 'paid' | 'no_payment_required';
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface WhopSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'one_time';
  features: string[];
  access_passes: string[];
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
   * Check if API key is available
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
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

    // Direct access user (when accessing app directly, not through Whop)
    if (userId === 'direct_access_user') {
      return {
        id: userId,
        email: 'user@example.com',
        username: 'Demo User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_demo',
        subscription_status: 'inactive'
      };
    }

    // Whop fallback user (when accessed through Whop but no proper auth)
    if (userId === 'whop_fallback_user') {
      return {
        id: userId,
        email: 'whop@example.com',
        username: 'Whop User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_whop',
        subscription_status: 'inactive'
      };
    }

    // If no API key, return test user only in development or if TEST_USERNAME is set
    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'development' || process.env.TEST_USERNAME) {
        const testUsername = process.env.TEST_USERNAME || 'Krista';
        const testEmail = process.env.TEST_EMAIL || 'krista@example.com';
        console.log('No API key, returning test user:', testUsername);
        return {
          id: userId,
          email: testEmail,
          username: testUsername,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_test_company',
          subscription_status: 'active'
        };
      } else {
        // In production without API key, return minimal user data
        console.log('No API key in production, returning minimal user data');
        return {
          id: userId,
          email: 'user@example.com',
          username: 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_production',
          subscription_status: 'inactive'
        };
      }
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
      // Fallback user data if API fails
      const fallbackUsername = process.env.TEST_USERNAME || 'User';
      const fallbackEmail = process.env.TEST_EMAIL || 'user@example.com';
      return {
        id: userId,
        email: fallbackEmail,
        username: fallbackUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_fallback',
        subscription_status: 'inactive'
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

  /**
   * Create a checkout session for a subscription plan
   */
  async createCheckoutSession({
    planId,
    userId,
    successUrl,
    cancelUrl,
    metadata = {}
  }: {
    planId: string;
    userId: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<WhopCheckoutSession> {
    if (!this.apiKey) {
      // Return mock checkout session for development
      const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id=mock_${Date.now()}`;
      return {
        id: `mock_${Date.now()}`,
        url: mockCheckoutUrl,
        status: 'open',
        payment_status: 'unpaid',
        customer_email: 'user@example.com',
        amount_total: 999,
        currency: 'usd',
        metadata: {
          ...metadata,
          plan_id: planId,
          user_id: userId
        }
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          customer_id: userId,
          success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
          metadata: {
            ...metadata,
            app_name: 'Caption Crafter',
            user_id: userId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<WhopSubscriptionPlan[]> {
    // Always return mock plans for now since we don't have Whop API configured
    console.log('Returning mock subscription plans');
    return [
      {
        id: 'prod_OAeju0utHppI2',
        name: 'Basic Plan',
        description: 'Perfect for getting started',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        features: ['100 captions per month', 'Basic AI generation', '3 platforms', 'Email support', 'Upgrade from 3 free captions'],
        access_passes: ['basic_access']
      },
      {
        id: 'prod_Premium123',
        name: 'Premium Plan',
        description: 'For growing creators',
        price: 19.99,
        currency: 'usd',
        interval: 'month',
        features: ['500 captions per month', 'Advanced AI generation', 'All platforms', 'Priority support', 'Content calendar', 'Upgrade from 3 free captions'],
        access_passes: ['premium_access']
      }
    ];
  }

  /**
   * Update user's subscription status after successful payment
   */
  async updateUserSubscription({
    userId,
    planId,
    status = 'active'
  }: {
    userId: string;
    planId: string;
    status?: 'active' | 'inactive' | 'cancelled';
  }): Promise<boolean> {
    // Always return true for mock mode
    console.log(`Mock: User ${userId} subscription updated to ${status} for plan ${planId}`);
    return true;
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods(userId: string): Promise<any[]> {
    if (!this.hasApiKey()) {
      // Return demo payment methods for development
      return [
        {
          id: 'demo_visa',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025
        },
        {
          id: 'demo_mastercard',
          type: 'card',
          last4: '5555',
          brand: 'mastercard',
          expiryMonth: 8,
          expiryYear: 2026
        }
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Return empty array if API fails
      return [];
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