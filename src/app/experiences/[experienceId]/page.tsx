import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ experienceId: string }>;
}

export default async function ExperiencePage({ params }: PageProps) {
  const { experienceId } = await params;
  const headersList = await headers(); // Get the headers from the request.

  try {
    // Extract the user ID (read from a verified auth JWT token)
    const { userId } = await whopSdk.verifyUserToken(headersList);

    // Load the user's public profile information
    const user = await whopSdk.getUser({ userId: userId });

    console.log('Whop User:', user);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {user.profile_picture_url && (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.username || user.email}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      user.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-500 capitalize">
                      {user.subscription_status || 'Unknown'} Subscription
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">User Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Experience ID</h3>
                <p className="text-gray-600">Current Experience: <code className="bg-gray-100 px-2 py-1 rounded">{experienceId}</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading user:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to authenticate with Whop'}
          </p>
          <p className="text-sm text-gray-500">
            Make sure you're accessing this page through Whop with proper authentication.
          </p>
        </div>
      </div>
    );
  }
}

