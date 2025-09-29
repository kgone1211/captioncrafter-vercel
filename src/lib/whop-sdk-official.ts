import { WhopServerSdk } from "@whop/api";

export const whopSdk = WhopServerSdk({
	// Add your app id here - this is required.
	// You can get this from the Whop dashboard after creating an app section.
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",

	// Add your app api key here - this is required.
	// You can get this from the Whop dashboard after creating an app section.
	appApiKey: process.env.WHOP_API_KEY ?? "fallback",

	// This will make api requests on behalf of this user.
	// This is optional, however most api requests need to be made on behalf of a user.
	// You can create an agent user for your app, and use their userId here.
	// You can also apply a different userId later with the `withUser` function.
	onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,

	// This is the companyId that will be used for the api requests.
	// When making api requests that query or mutate data about a company, you need to specify the companyId.
	// This is optional, however if not specified certain requests will fail.
	// This can also be applied later with the `withCompany` function.
	companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// Re-export types for compatibility with existing code
export interface WhopUser {
	id: string;
	email: string;
	username?: string;
	name?: string;
	profile_picture_url?: string;
	created_at: string;
	updated_at: string;
	company_id?: string;
	subscription_status?: 'active' | 'inactive' | 'cancelled';
}

export interface WhopCompany {
	id: string;
	name: string;
	title?: string;
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
