'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentUser, clearAuth, setUser as setAuthUser, type MockUser } from '@/lib/auth'

interface AuthContextType {
  user: MockUser | null
  isLoading: boolean
  signIn: (user: MockUser) => void
  signOut: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }

  const signIn = (userData: MockUser) => {
    setAuthUser(userData)
    setUser(userData)
  }

  const signOut = () => {
    // Clear auth immediately
    clearAuth()
    // Update state synchronously
    setUser(null)
    setIsLoading(false)
    // Force a re-check to ensure all components update
    checkAuth()
  }

  useEffect(() => {
    // Check initial auth state
    checkAuth()

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'financepro_auth') {
        checkAuth()
      }
    }

    // Listen for custom auth change event (same-tab updates)
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, []) // Remove pathname dependency - only run once on mount

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

