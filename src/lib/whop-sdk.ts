export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  subscription_status?: 'active' | 'inactive' | 'cancelled';
  plan_id?: string;
  subscription_plan_id?: string;
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
 * Production Whop SDK implementation - no demo/mock modes
 * Requires valid WHOP_API_KEY for all operations
 */
class WhopSDK {
  private apiKey: string;
  private baseUrl = 'https://api.whop.com/api/v2';

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('WHOP_API_KEY environment variable is required');
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
   * Get user information from Whop API - Production only
   */
  async getUser({ userId }: { userId: string }): Promise<WhopUser> {
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
      
      // Get subscription status and plan info
      const subscriptionStatus = await this.getUserSubscriptionStatus(userId);
      const planInfo = await this.getUserSubscriptionPlan(userId);
      
      return {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        profile_picture_url: userData.profile_picture_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        company_id: userData.company_id,
        subscription_status: subscriptionStatus,
        plan_id: planInfo?.plan_id,
        subscription_plan_id: planInfo?.plan_id
      };
    } catch (error) {
      console.error('Error fetching Whop user:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription status
   */
  async getUserSubscriptionStatus(userId: string): Promise<'active' | 'inactive' | 'cancelled'> {
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
   * Get user's subscription plan information
   */
  async getUserSubscriptionPlan(userId: string): Promise<{ plan_id: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const subscriptions = data.data || [];
      
      // Find the active subscription
      const activeSubscription = subscriptions.find((sub: WhopSubscription) => sub.status === 'active');
      
      if (activeSubscription) {
        return { plan_id: activeSubscription.plan_id };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }

  /**
   * Check if user has access to a specific experience
   */
  async checkIfUserHasAccessToExperience({ userId, experienceId }: { userId: string; experienceId: string }): Promise<WhopAccessResult> {
    try {
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
    if (!this.hasApiKey()) {
      throw new Error('WHOP_API_KEY is required for checkout sessions');
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
        const errorText = await response.text();
        console.error('Whop API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to create checkout session: ${response.status} ${response.statusText} - ${errorText}`);
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
    try {
      const response = await fetch(`${this.baseUrl}/plans`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status} ${response.statusText}`);
      }

      const plans = await response.json();
      return plans.data || plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update subscription: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods(userId: string): Promise<any[]> {
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
      throw error;
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