'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAuthenticated } from '@/lib/auth'

const PUBLIC_ROUTES = ['/', '/auth']

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef<string | null>(null)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    // Check auth state directly from localStorage on every pathname/user change
    const checkAndRedirect = () => {
      const isAuth = isAuthenticated()
      
      // Allow public routes
      if (isPublicRoute) {
        redirectingRef.current = null
        return
      }

      // For protected routes, check auth immediately
      if (!isAuth || (!isLoading && !user)) {
        // Only redirect if we haven't already redirected to this pathname
        if (redirectingRef.current !== pathname) {
          redirectingRef.current = pathname
          router.replace('/auth')
        }
      } else {
        redirectingRef.current = null
      }
    }

    // Check immediately
    checkAndRedirect()

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAndRedirect()
    }

    window.addEventListener('auth-change', handleAuthChange)
    window.addEventListener('storage', (e) => {
      if (e.key === 'financepro_auth') {
        checkAndRedirect()
      }
    })

    return () => {
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [pathname, user, isLoading, router, isPublicRoute])

  // Check auth state on every render for protected routes
  const isAuth = typeof window !== 'undefined' ? isAuthenticated() : false

  // Show nothing while checking auth on protected routes (prevents flash)
  if (!isPublicRoute && isLoading) {
    if (!isAuth) {
      return null
    }
  }

  // Allow public routes
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Protect all other routes - check both localStorage and context
  // If not authenticated, show nothing (redirecting)
  if (!isAuth || (!isLoading && !user)) {
    return null
  }

  return <>{children}</>
}

