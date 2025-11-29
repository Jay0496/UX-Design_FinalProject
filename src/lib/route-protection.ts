// Client-side route protection utility
// Since we're using localStorage (client-side), we handle protection in components

import { isAuthenticated } from './auth'

export function requireAuth() {
  if (typeof window === 'undefined') return false
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth']
  const currentPath = window.location.pathname
  
  // If on a public route, allow access
  if (publicRoutes.includes(currentPath)) {
    return true
  }
  
  // For protected routes, check authentication
  return isAuthenticated()
}

export function getRedirectPath(): string {
  return '/auth'
}

