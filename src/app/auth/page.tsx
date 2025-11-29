'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [view, setView] = useState<'signIn' | 'signUp'>('signIn')
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const showMessage = (text: string, isError: boolean = true) => {
    setMessage({ text, isError })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Mock sign in - just create a user
    setTimeout(() => {
      const mockUser = {
        email,
        name: email.split('@')[0],
        id: 'user_' + Date.now(),
      }
      signIn(mockUser)
      showMessage(`Successfully signed in as ${email}!`, false)
      setLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    }, 500)
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters long.', true)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', true)
      setLoading(false)
      return
    }

    // Mock sign up
    setTimeout(() => {
      const mockUser = {
        email,
        name: email.split('@')[0],
        id: 'user_' + Date.now(),
      }
      signIn(mockUser)
      showMessage(`Account created for ${email}! You are now signed in.`, false)
      setLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    }, 500)
  }

  const handleGoogleSignIn = () => {
    setLoading(true)
    // Mock Google sign in
    setTimeout(() => {
      const mockUser = {
        email: 'jane.doe@gmail.com',
        name: 'Jane Doe',
        id: 'user_google_' + Date.now(),
      }
      signIn(mockUser)
      showMessage(`Successfully signed in with Google as ${mockUser.email}!`, false)
      setLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    }, 500)
  }

  const handleOutlookSignIn = () => {
    showMessage('Outlook/Microsoft sign-in functionality is a placeholder in this demo.', true)
  }

  return (
    <main className="flex-grow flex items-center justify-center p-4 bg-gray-50 min-h-screen">
      <div className="bg-white w-full max-w-sm sm:max-w-md shadow-2xl rounded-xl overflow-hidden transform transition-all duration-300">
        {/* Auth Switch Tabs */}
        <div className="flex text-center font-semibold text-lg">
          <button
            onClick={() => {
              setView('signIn')
              setMessage(null)
            }}
            className={`flex-1 p-4 transition duration-300 rounded-tl-xl ${
              view === 'signIn'
                ? 'text-indigo-600 bg-indigo-50 border-b-3 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setView('signUp')
              setMessage(null)
            }}
            className={`flex-1 p-4 transition duration-300 rounded-tr-xl ${
              view === 'signUp'
                ? 'text-indigo-600 bg-indigo-50 border-b-3 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Message Box */}
          {message && (
            <div
              className={`p-3 mb-4 text-sm rounded-lg ${
                message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* Social Prompt */}
          <p className="text-center text-gray-600 text-sm mb-4">
            {view === 'signIn' ? 'Sign in with:' : 'Sign up with:'}
          </p>

          {/* Social Sign-in Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.0003 4.75C14.027 4.75 15.6582 5.4651 16.9038 6.64344L19.4632 4.084C17.7289 2.45421 15.1764 1.75 12.0003 1.75C8.03841 1.75 4.67138 3.9039 2.98369 7.05L5.80168 9.2903C6.67134 7.24074 9.12456 5.86725 12.0003 5.86725V4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M11.9998 18.25C9.12404 18.25 6.67082 16.8765 5.80116 14.827L2.98317 17.0673C4.67086 20.2136 8.03788 22.3675 11.9998 22.3675C15.8624 22.3675 19.3444 20.9169 20.8938 17.5132L18.0677 15.2863C16.8906 17.0664 14.619 18.25 11.9998 18.25Z"
                  fill="#34A853"
                />
                <path
                  d="M21.3149 10.7093H11.9998V13.8837H17.4116C17.1852 14.8693 16.5165 15.7675 15.5451 16.3683L18.3712 18.5952C16.7262 20.2195 14.5029 21.3675 11.9998 21.3675C8.03788 21.3675 4.67086 19.2136 2.98317 16.0673L5.80116 13.827C6.67082 15.8765 9.12404 17.25 11.9998 17.25V10.7093Z"
                  fill="#4285F4"
                />
                <path
                  d="M20.8938 6.48421L18.0677 8.71114C16.8906 6.93106 14.619 5.7475 11.9998 5.7475C9.12404 5.7475 6.67082 7.121 5.80116 9.17056L2.98317 6.93026C4.67086 3.78396 8.03788 1.63006 11.9998 1.63006C15.1764 1.63006 17.7289 2.3358 19.4632 3.96558L20.8938 6.48421Z"
                  fill="#FBBC05"
                />
              </svg>
              {view === 'signIn' ? 'Sign In with Google' : 'Sign Up with Google'}
            </button>
            <button
              onClick={handleOutlookSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0072C6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-3"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.83 1.83 0 0 1-2.07 0L2 7" />
              </svg>
              {view === 'signIn' ? 'Sign In with Outlook' : 'Sign Up with Outlook'}
            </button>
          </div>

          {/* OR Divider */}
          <div className="relative flex justify-center items-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative bg-white px-4 text-sm text-gray-500">
              {view === 'signIn' ? 'Or sign in with email' : 'Or sign up with email'}
            </div>
          </div>

          {/* Sign In Form */}
          {view === 'signIn' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  autoComplete="email"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="signin-password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {view === 'signUp' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  autoComplete="email"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="signup-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="signup-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

