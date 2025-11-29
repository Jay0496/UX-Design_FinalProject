// Mock authentication utility using localStorage

const AUTH_KEY = 'financepro_auth'

export interface MockUser {
  email: string
  name: string
  id: string
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const auth = localStorage.getItem(AUTH_KEY)
  return auth !== null
}

export function getCurrentUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  const auth = localStorage.getItem(AUTH_KEY)
  if (!auth) return null
  try {
    return JSON.parse(auth)
  } catch {
    return null
  }
}

export function setUser(user: MockUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  // Dispatch custom event to notify navbar of auth change
  window.dispatchEvent(new Event('auth-change'))
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
  // Dispatch custom event to notify navbar of auth change
  window.dispatchEvent(new Event('auth-change'))
}

// Initialize with default user if none exists (for "default to signed in" requirement)
export function initializeDefaultUser(): void {
  if (typeof window === 'undefined') return
  if (!isAuthenticated()) {
    const defaultUser: MockUser = {
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      id: 'user_default',
    }
    setUser(defaultUser)
  }
}

