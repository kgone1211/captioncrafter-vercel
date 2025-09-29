import { whopSdk } from "@/lib/whop-sdk-official";
import { headers } from "next/headers";
import ClientAuthWrapper from '@/components/ClientAuthWrapper';
import Paywall from '@/components/Paywall';
import { db } from '@/lib/db';

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	try {
		// The user token is in the headers
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const result = await whopSdk.access.checkIfUserHasAccessToExperience({
			userId,
			experienceId,
		});

		const user = await whopSdk.users.getUser({ userId });
		const experience = await whopSdk.experiences.getExperience({ experienceId });

		// Either: 'admin' | 'customer' | 'no_access';
		// 'admin' means the user is an admin of the whop, such as an owner or moderator
		// 'customer' means the user is a common member in this whop
		// 'no_access' means the user does not have access to the whop
		const { accessLevel } = result;

		console.log('Experience access check:', {
			userId,
			experienceId,
			hasAccess: result.hasAccess,
			accessLevel,
			userName: user.name,
			experienceName: experience.name
		});

		// Create/update user in our database
		let dbUserId;
		try {
			await db.initDatabase();
			dbUserId = await db.upsertUser(
				user.email || `user-${userId}@example.com`,
				userId,
				result.hasAccess ? 'active' : 'inactive',
				user.username || user.name
			);
		} catch (dbError) {
			console.error('Database error:', dbError);
			// Generate a dynamic fallback user ID based on the Whop user ID
			dbUserId = Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) || 1;
		}

		// Check if user can generate captions (freemium model)
		let canGenerate;
		try {
			canGenerate = await db.canGenerateCaption(dbUserId);
		} catch (canGenerateError) {
			console.error('Can generate error:', canGenerateError);
			canGenerate = true; // Fallback to allowing generation
		}

		// Convert Whop user to our format
		const whopUser = {
			id: userId,
			email: user.email || `user-${userId}@example.com`,
			username: user.username || user.name || 'User',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			company_id: experience.company_id,
			subscription_status: result.hasAccess ? 'active' as const : 'inactive' as const
		};

		// Create auth result for ClientAuthWrapper
		const auth = {
			userId: userId,
			isAuthenticated: true,
			source: 'whop-headers' as const
		};

		return (
			<ClientAuthWrapper 
				fallbackAuth={auth}
				fallbackWhopUser={whopUser}
				fallbackDbUserId={dbUserId}
				fallbackCanGenerate={canGenerate}
			/>
		);

	} catch (error) {
		console.error('Error in ExperiencePage:', error);
		
		// Show error page for authentication issues
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-center max-w-md mx-4">
					<div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Error</h2>
					<p className="text-gray-600 dark:text-gray-300 mb-4">
						Unable to authenticate with Whop. Please try refreshing the page or contact support.
					</p>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Error: {error instanceof Error ? error.message : 'Unknown error'}
					</p>
				</div>
			</div>
		);
	}
}