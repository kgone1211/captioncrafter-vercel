import { whopSdk, WhopUser } from "@/lib/whop-sdk";
import { getWhopAuth, isWhopRequest } from "@/lib/whop-auth";
import HomeClientPage from './home-client';

export default async function Home() {
  try {
    // Get Whop authentication
    const auth = await getWhopAuth();
    
    console.log('Authentication result:', auth);
    
    if (!auth.isAuthenticated) {
      // Check if this is a direct access (not through Whop)
      if (!(await isWhopRequest())) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Caption Crafter</h2>
              <p className="text-gray-600 mb-4">
                This app is designed to be used through Whop. Please access it through your Whop dashboard.
              </p>
              <p className="text-sm text-gray-500">
                If you're the app owner, make sure the app is properly configured in your Whop dashboard.
              </p>
            </div>
          </div>
        );
      }
      
      // If accessed through Whop but no auth, show error
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
              Unable to authenticate with Whop. Please try refreshing the page or contact support.
            </p>
            <p className="text-sm text-gray-500">
              Auth source: {auth.source}
            </p>
          </div>
        </div>
      );
    }

    const userId = auth.userId;

    // Check if user has access to any of the Caption Crafter access passes
    const accessPassIds = [
      "prod_u7hI8fmabpPkI",  // Original access pass
      "prod_n9vXnFGqiIGZj"   // New access pass
    ];
    
    let hasAccess = false;
    let accessResult = null;
    
    // Check each access pass
    for (const accessPassId of accessPassIds) {
      const result = await whopSdk.access.checkIfUserHasAccessToAccessPass({
        userId,
        accessPassId,
      });
      
      if (result.hasAccess) {
        hasAccess = true;
        accessResult = result;
        console.log(`User has access via access pass: ${accessPassId}`);
        break;
      }
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need a Caption Crafter access pass to use this app.</p>
            <p className="text-sm text-gray-500">
              Please purchase an access pass to continue.
            </p>
          </div>
        </div>
      );
    }

    // Load the user's public profile information
    const whopUser = await whopSdk.getUser({ userId: userId });

    console.log('Whop User:', whopUser);
    console.log('Access Pass:', accessResult);

    // accessResult should never be null at this point since we checked hasAccess above
    if (!accessResult) {
      throw new Error('Access result is null despite having access');
    }

    return <HomeClientPage whopUser={whopUser} accessPass={accessResult} />;
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'This app requires Whop authentication'}
          </p>
          <p className="text-sm text-gray-500">
            Please access this app through Whop with proper authentication.
          </p>
        </div>
      </div>
    );
  }
}