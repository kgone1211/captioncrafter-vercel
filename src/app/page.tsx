import { whopSdk, WhopUser } from "@/lib/whop-sdk";
import { getWhopAuth, isWhopRequest } from "@/lib/whop-auth";
import HomeClientPage from './home-client';
import Paywall from '@/components/Paywall';
import { Database } from '@/lib/db';

export default async function Home() {
  try {
    // Get Whop authentication
    const auth = await getWhopAuth();
    
    console.log('Authentication result:', auth);
    
    if (!auth.isAuthenticated) {
      // Check if this is a direct access (not through Whop)
      if (!(await isWhopRequest())) {
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center max-w-md mx-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Caption Crafter</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This app is designed to be used through Whop. Please access it through your Whop dashboard.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you're the app owner, make sure the app is properly configured in your Whop dashboard.
              </p>
            </div>
          </div>
        );
      }
      
      // If accessed through Whop but no auth, show error
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
              Auth source: {auth.source}
            </p>
          </div>
        </div>
      );
    }

    const userId = auth.userId;

    // Load the user's public profile information
    const whopUser = await whopSdk.getUser({ userId: userId });

    console.log('Whop User:', whopUser);

    // Create/update user in our database
    const db = new Database();
    const dbUserId = await db.upsertUser(
      whopUser.email, 
      whopUser.id, 
      whopUser.subscription_status
    );

    // Check if user can generate captions (freemium model)
    const canGenerate = await db.canGenerateCaption(dbUserId);
    
    // If user can't generate captions (hit limit), show paywall
    if (!canGenerate) {
      return <Paywall whopUser={whopUser} dbUserId={dbUserId} />;
    }

    // If user can generate captions, show the app
    return <HomeClientPage whopUser={whopUser} />;
  } catch (error) {
    console.error('Error loading user:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error instanceof Error ? error.message : 'This app requires Whop authentication'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please access this app through Whop with proper authentication.
          </p>
        </div>
      </div>
    );
  }
}