import { whopSdk, WhopUser } from "@/lib/whop-sdk";
import { getWhopAuth } from "@/lib/whop-auth";
import WhopClientPage from './whop-client';

// Force dynamic rendering since we use headers() for authentication
export const dynamic = 'force-dynamic';

export default async function WhopPage() {
  try {
    // Get Whop authentication
    const auth = await getWhopAuth();
    
    console.log('Whop Page Auth:', auth);
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      WHOP_API_KEY: process.env.WHOP_API_KEY ? 'set' : 'missing',
      WHOP_DEV_MODE: process.env.WHOP_DEV_MODE,
      TEST_USERNAME: process.env.TEST_USERNAME
    });
    
    if (!auth.isAuthenticated) {
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
              Unable to authenticate with Whop. Please check your Whop configuration.
            </p>
            <p className="text-sm text-gray-500">
              Auth source: {auth.source}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
              <p><strong>Production Debug Info:</strong></p>
              <p>User ID: {auth.userId || 'Not provided'}</p>
              <p>Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Source: {auth.source}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
              <div className="mt-2">
                <p><strong>Troubleshooting:</strong></p>
                <ul className="list-disc list-inside text-xs">
                  <li>Ensure you're accessing this app through Whop's iframe</li>
                  <li>Check that your app is properly configured in Whop dashboard</li>
                  <li>Verify your app has the correct permissions</li>
                  <li>Make sure you're logged into Whop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Load the user's public profile information
    console.log('Attempting to get user with ID:', auth.userId);
    const whopUser = await whopSdk.getUser({ userId: auth.userId });

    console.log('Whop User Result:', whopUser);

    return <WhopClientPage whopUser={whopUser} />;
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

