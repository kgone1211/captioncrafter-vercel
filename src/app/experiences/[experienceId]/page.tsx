import { whopSdk, WhopUser } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import WhopClientPage from "@/app/whop/whop-client";

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
    const whopUser = await whopSdk.getUser({ userId: userId });

    console.log('Whop User:', whopUser);

    // Pass the Whop user data to the client component
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

