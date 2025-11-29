'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function LogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    setLoading(true)
    signOut()
    // ProtectedRoute will handle the redirect automatically
    router.replace('/auth')
    setLoading(false)
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="mt-4 rounded-md bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}

