// Whop integration utilities
export interface WhopUser {
  id: string;
  email: string;
  company_id: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
}

export interface WhopSubscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan_id: string;
  user_id: string;
}

export class WhopAPI {
  private apiKey: string;
  private baseUrl = 'https://api.whop.com/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUser(userId: string): Promise<WhopUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Whop API error:', response.status, response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Whop user:', error);
      return null;
    }
  }

  async getUserSubscriptions(userId: string): Promise<WhopSubscription[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Whop API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Whop subscriptions:', error);
      return [];
    }
  }

  async validateUserAccess(userId: string): Promise<boolean> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      return subscriptions.some(sub => sub.status === 'active');
    } catch (error) {
      console.error('Error validating user access:', error);
      return false;
    }
  }
}

// Initialize Whop API
export const whopAPI = new WhopAPI(process.env.WHOP_API_KEY || '');

// Whop authentication middleware
export async function validateWhopUser(userId: string): Promise<WhopUser | null> {
  // Test mode for local development
  if (process.env.NODE_ENV === 'development' && userId.startsWith('test_')) {
    console.log('Using test mode for Whop user:', userId);
    return {
      id: userId,
      email: 'test@example.com',
      company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_0iRabAN0PuLJni',
      subscription_status: 'active'
    };
  }

  if (!process.env.WHOP_API_KEY) {
    console.warn('Whop API key not configured');
    return null;
  }

  try {
    const user = await whopAPI.getUser(userId);
    if (!user) {
      console.warn('User not found in Whop:', userId);
      return null;
    }

    const hasAccess = await whopAPI.validateUserAccess(userId);
    if (!hasAccess) {
      console.warn('User does not have active subscription:', userId);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating Whop user:', error);
    return null;
  }
}
