export default function DiscoverPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
						CaptionCrafter
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
						AI-powered social media caption generator with smart scheduling. 
						Create engaging captions for Instagram, X (Twitter), and TikTok in seconds.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8 mb-16">
					{/* Feature 1 */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
						<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
							<svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
							AI-Powered Generation
						</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Generate engaging captions using advanced AI technology. 
							Choose from multiple tones and styles to match your brand.
						</p>
					</div>

					{/* Feature 2 */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
						<div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
							<svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
							Smart Scheduling
						</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Schedule your posts with precision. Set up automated posting 
							and never miss the perfect time to engage your audience.
						</p>
					</div>

					{/* Feature 3 */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
						<div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
							<svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
							Multi-Platform Support
						</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Optimized for Instagram, X (Twitter), and TikTok. 
							Each caption is tailored to the specific platform's best practices.
						</p>
					</div>
				</div>

				{/* Pricing */}
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">
						Simple Pricing
					</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="text-center">
							<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Free Tier
							</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
								$0
							</div>
							<ul className="text-gray-600 dark:text-gray-300 space-y-2">
								<li>✓ 3 free captions per day</li>
								<li>✓ Basic AI generation</li>
								<li>✓ All platforms supported</li>
								<li>✓ Caption library</li>
							</ul>
						</div>
						<div className="text-center">
							<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Premium
							</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
								$9.99<span className="text-lg text-gray-500">/month</span>
							</div>
							<ul className="text-gray-600 dark:text-gray-300 space-y-2">
								<li>✓ Unlimited captions</li>
								<li>✓ Advanced AI features</li>
								<li>✓ Smart scheduling</li>
								<li>✓ Priority support</li>
								<li>✓ Analytics dashboard</li>
							</ul>
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
						Ready to Create Amazing Captions?
					</h2>
					<p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
						Join thousands of content creators who trust CaptionCrafter
					</p>
					<div className="space-x-4">
						<a
							href="https://whop.com/dashboard"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Get Started on Whop
						</a>
						<a
							href="https://dev.whop.com"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Learn More
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
