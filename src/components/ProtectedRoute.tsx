'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const PUBLIC_ROUTES = ['/', '/auth', '/auth/callback', '/auth/auth-code-error']

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef<string | null>(null)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/auth/')

  useEffect(() => {
    // Allow public routes
    if (isPublicRoute) {
      redirectingRef.current = null
      return
    }

    // For protected routes, check auth
    if (!isLoading && !user) {
      // Only redirect if we haven't already redirected to this pathname
      if (redirectingRef.current !== pathname) {
        redirectingRef.current = pathname
        router.replace(`/auth?redirectedFrom=${encodeURIComponent(pathname)}`)
      }
    } else {
      redirectingRef.current = null
    }
  }, [pathname, user, isLoading, router, isPublicRoute])

  // Show nothing while checking auth on protected routes (prevents flash)
  if (!isPublicRoute && isLoading) {
    return null
  }

  // Allow public routes
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Protect all other routes - if not authenticated, show nothing (redirecting)
  if (!isLoading && !user) {
    return null
  }

  return <>{children}</>
}

