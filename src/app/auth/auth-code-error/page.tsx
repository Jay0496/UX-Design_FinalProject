'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')
  const type = searchParams.get('type')

  return (
    <div className="flex min-h-screen items-center justify-center p-24 bg-gray-50">
      <div className="text-center max-w-2xl w-full px-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Authentication Error</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="font-semibold text-red-800 mb-2">Error: {error}</p>
            {description && (
              <p className="text-red-700 text-sm">{description}</p>
            )}
            {type === 'exchange' && (
              <p className="text-red-700 text-sm mt-2">
                This error occurred when exchanging the authorization code. 
                Check your Supabase configuration and OAuth provider settings.
              </p>
            )}
            {error === 'no_code_received' && (
              <p className="text-red-700 text-sm mt-2">
                No authorization code was received from the OAuth provider. 
                This might indicate a redirect URI mismatch or the OAuth flow was cancelled.
              </p>
            )}
          </div>
        )}
        {!error && (
          <p className="text-gray-600 mb-4">
            There was an error during authentication. Please try again.
          </p>
        )}
        <div className="space-x-4">
          <Link
            href="/auth"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
          >
            Go back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-24 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}

