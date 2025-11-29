'use client'

import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600">
          There was an error during authentication. Please try again.
        </p>
        <Link
          href="/auth"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Go back to sign in
        </Link>
      </div>
    </div>
  )
}

