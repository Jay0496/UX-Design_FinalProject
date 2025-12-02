'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const isLoggedIn = !!user

  return (
    <>
      {/* Hero Section */}
      <header className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Achieve <span className="text-indigo-600">Financial Freedom</span>, Simplified.
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            FinancePro gives you a complete, real-time picture of your money, making budgeting, goal setting, and debt payoff stress-free.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href={isLoggedIn ? '/dashboard' : '/auth'}
              className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Tools, Effortless Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Budgeting */}
            <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-indigo-500">
              <div className="text-indigo-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-scale"
                >
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 12V3" />
                  <path d="M5 5h4" />
                  <path d="M15 5h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Budgeting</h3>
              <p className="text-gray-600">
                Track every penny with automatic categorization. See exactly where your money goes and set realistic limits.
              </p>
            </div>

            {/* Feature 2: Goal Setting */}
            <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-green-500">
              <div className="text-green-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-target"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Accelerate Goals</h3>
              <p className="text-gray-600">
                Set saving goals for a house, retirement, or vacation. Our planner shows you the fastest path to achieve them.
              </p>
            </div>

            {/* Feature 3: Debt Strategy */}
            <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-red-500">
              <div className="text-red-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trending-down"
                >
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay Off Debt Faster</h3>
              <p className="text-gray-600">
                Visualize your debt snowball or avalanche strategy and know exactly when you&apos;ll be debt-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Trusted by Thousands of Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-400">
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-gray-700">
                &quot;I finally feel in control of my money. The goal setting feature is a game-changer for saving for my wedding!&quot;
              </p>
              <p className="mt-4 font-semibold text-sm text-gray-900">- Sarah K., New York</p>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-400">
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-gray-700">
                &quot;The best debt management tool I&apos;ve used. Seeing the payoff date adjust as I make extra payments is so motivating.&quot;
              </p>
              <p className="mt-4 font-semibold text-sm text-gray-900">- Alex T., Toronto</p>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-400">
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-gray-700">
                &quot;Fantastic clarity on my overall financial health. The automatic syncing is flawless and saved me hours of manual tracking.&quot;
              </p>
              <p className="mt-4 font-semibold text-sm text-gray-900">- Michael R., London</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
