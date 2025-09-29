import { whopSdk } from "@/lib/whop-sdk-official";
import { headers } from "next/headers";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The companyId is a path param
	const { companyId } = await params;

	try {
		// The user token is in the headers
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const result = await whopSdk.access.checkIfUserHasAccessToCompany({
			userId,
			companyId,
		});

		const user = await whopSdk.users.getUser({ userId });
		const company = await whopSdk.companies.getCompany({ companyId });

		// Either: 'admin' | 'no_access';
		// 'admin' means the user is an admin of the company, such as an owner or moderator
		// 'no_access' means the user is not an authorized member of the company
		const { accessLevel } = result;

		console.log('Company access check:', {
			userId,
			companyId,
			hasAccess: result.hasAccess,
			accessLevel,
			userName: user.name,
			companyName: company.title
		});

		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-8">
				<div className="max-w-4xl w-full">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
								CaptionCrafter Dashboard
							</h1>
							<p className="text-gray-600 dark:text-gray-300">
								Company Management Portal
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							{/* User Info */}
							<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
									User Information
								</h2>
								<div className="space-y-2">
									<p><strong>Name:</strong> {user.name || 'N/A'}</p>
									<p><strong>Username:</strong> @{user.username}</p>
									<p><strong>User ID:</strong> {userId}</p>
									<p><strong>Access Level:</strong> 
										<span className={`ml-2 px-2 py-1 rounded text-sm ${
											accessLevel === 'admin' 
												? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
												: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
										}`}>
											{accessLevel}
										</span>
									</p>
								</div>
							</div>

							{/* Company Info */}
							<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
									Company Information
								</h2>
								<div className="space-y-2">
									<p><strong>Company:</strong> {company.title}</p>
									<p><strong>Company ID:</strong> {companyId}</p>
									<p><strong>Access Status:</strong> 
										<span className={`ml-2 px-2 py-1 rounded text-sm ${
											result.hasAccess 
												? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
												: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
										}`}>
											{result.hasAccess ? 'Authorized' : 'No Access'}
										</span>
									</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="mt-8 text-center">
							{result.hasAccess ? (
								<div className="space-x-4">
									<a
										href={`/experiences/${companyId}`}
										className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										Access CaptionCrafter App
									</a>
									<a
										href="https://whop.com/dashboard"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										Whop Dashboard
									</a>
								</div>
							) : (
								<div className="text-center">
									<p className="text-red-600 dark:text-red-400 mb-4">
										You don't have access to this company's CaptionCrafter instance.
									</p>
									<a
										href="https://whop.com/dashboard"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										Go to Whop Dashboard
									</a>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);

	} catch (error) {
		console.error('Error in DashboardPage:', error);
		
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
