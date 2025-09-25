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
   * Verify user token from Whop headers
   * This extracts the user ID from the verified JWT token
   */
  async verifyUserToken(headersList: Headers): Promise<{ userId: string }> {
    // In a real Whop integration, you would verify the JWT token here
    // For now, we'll extract from headers or use test mode
    
    const authorization = headersList.get('authorization');
    const whopUserId = headersList.get('x-whop-user-id');
    const whopCompanyId = headersList.get('x-whop-company-id');
    
    // Development mode - use test user
    if (process.env.NODE_ENV === 'development' && !whopUserId) {
      console.log('Development mode: Using test user');
      return { userId: 'test_user_123' };
    }
    
    // Production mode - require Whop headers
    if (!whopUserId) {
      throw new Error('No Whop user ID found in headers. Please access this app through Whop with proper authentication.');
    }
    
    return { userId: whopUserId };
  }

  /**
   * Get user information from Whop API
   */
  async getUser({ userId }: { userId: string }): Promise<WhopUser> {
    // Test mode for development
    if (process.env.NODE_ENV === 'development' && userId.startsWith('test_')) {
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
      throw new Error('Failed to fetch user from Whop');
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
   * Get company information
   */
  async getCompany({ companyId }: { companyId: string }): Promise<WhopCompany> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status} ${response.statusText}`);
      }

      const companyData = await response.json();
      
      return {
        id: companyData.id,
        name: companyData.name,
        slug: companyData.slug,
        logo_url: companyData.logo_url
      };
    } catch (error) {
      console.error('Error fetching Whop company:', error);
      throw new Error('Failed to fetch company from Whop');
    }
  }

  /**
   * Validate user access (has active subscription)
   */
  async validateUserAccess(userId: string): Promise<boolean> {
    const status = await this.getUserSubscriptionStatus(userId);
    return status === 'active';
  }

  /**
   * Check if user has access to a specific experience
   */
  async checkIfUserHasAccessToExperience({ userId, experienceId }: { userId: string; experienceId: string }): Promise<WhopAccessResult> {
    try {
      // Test mode for development
      if (process.env.NODE_ENV === 'development' && userId.startsWith('test_')) {
        console.log('Development mode: Granting access to experience:', experienceId);
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

      // In a real implementation, you would check the user's role in the company
      // For now, we'll assume all active subscribers are customers
      // You can enhance this by checking company roles via Whop API
      
      const response = await fetch(`${this.baseUrl}/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasAccess: false,
          accessLevel: 'no_access'
        };
      }

      const companies = await response.json();
      
      // Check if user is admin of any company
      const isAdmin = companies.data?.some((company: any) => 
        company.role === 'owner' || company.role === 'admin'
      );

      if (isAdmin) {
        return {
          hasAccess: true,
          accessLevel: 'admin'
        };
      }

      // If user has active subscription, they're a customer
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
      // Test mode for development
      if (process.env.NODE_ENV === 'development' && userId.startsWith('test_')) {
        console.log('Development mode: Granting access to company:', companyId);
        return {
          hasAccess: true,
          role: 'admin'
        };
      }

      if (!this.apiKey) {
        throw new Error('Whop API Key is not configured.');
      }

      // Get user's companies
      const response = await fetch(`${this.baseUrl}/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          hasAccess: false
        };
      }

      const companies = await response.json();
      
      // Check if user is a member of the specified company
      const userCompany = companies.data?.find((company: any) => 
        company.company_id === companyId || company.id === companyId
      );

      if (!userCompany) {
        return {
          hasAccess: false
        };
      }

      return {
        hasAccess: true,
        role: userCompany.role || 'member'
      };

    } catch (error) {
      console.error('Error checking user access to company:', error);
      return {
        hasAccess: false
      };
    }
  }
}

// Add access object to the SDK
class WhopSDKWithAccess extends WhopSDK {
  access = {
    checkIfUserHasAccessToExperience: this.checkIfUserHasAccessToExperience.bind(this),
    checkIfUserHasAccessToCompany: this.checkIfUserHasAccessToCompany.bind(this)
  };
}

// Export singleton instance with access methods
export const whopSdk = new WhopSDKWithAccess();

// Types are already exported as interfaces above
