'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const mapSupabaseUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.email?.split('@')[0] || 
            'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url || 
                  supabaseUser.user_metadata?.picture,
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      const mappedUser = mapSupabaseUser(supabaseUser)
      setUser(mappedUser)
    } catch (error) {
      console.error('Error checking auth:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Check initial auth state
    checkAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const mappedUser = mapSupabaseUser(session?.user ?? null)
      setUser(mappedUser)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, checkAuth }}>
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

