'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault()
    signOut()
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    // ProtectedRoute will handle the redirect automatically
    router.replace('/auth')
  }

  const userDisplay = user ? {
    name: user.name || user.email || 'User',
    email: user.email,
    avatar: `https://placehold.co/40x40/6366f1/ffffff?text=${(user.name || user.email || 'U').charAt(0).toUpperCase()}`,
  } : null

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-3xl font-extrabold text-indigo-600">
            Finance<span className="text-gray-900">Pro</span>
          </Link>

          {/* Desktop Navigation Links and Profile */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className={`font-medium transition duration-150 ${
                isDashboard ? 'text-gray-600 hover:text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Features
            </Link>
            <Link
              href="/accounts"
              className={`font-medium transition duration-150 ${
                pathname === '/accounts'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Accounts
            </Link>
            <Link
              href="/dashboard"
              className={`font-medium transition duration-150 ${
                isDashboard
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/goals"
              className={`font-medium transition duration-150 ${
                pathname === '/goals'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Goals
            </Link>
            <Link
              href="/debt"
              className={`font-medium transition duration-150 ${
                pathname === '/debt'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Debt
            </Link>

            {/* Profile Dropdown or Sign In Button */}
            {userDisplay ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white font-bold transition duration-150 shadow-md"
                  title={userDisplay.name}
                >
                  {userDisplay.name.charAt(0).toUpperCase()}
                  {userDisplay.name.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="py-1">
                      <Link
                        href="/auth"
                        onClick={handleSignOut}
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-150"
                      >
                        Sign Out
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="cursor-pointer p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none block"
              aria-label="Toggle mobile menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-menu"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-3 shadow-lg">
          <div className="px-2 pt-2 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/accounts"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/accounts'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Accounts
            </Link>
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isDashboard
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/goals"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/goals'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Goals
            </Link>
            <Link
              href="/debt"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/debt'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Debt
            </Link>
            {user ? (
              <div className="border-t pt-2 mt-2 border-gray-100">
                <Link
                  href="/auth"
                  onClick={handleSignOut}
                  className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Sign Out ({userDisplay?.name || 'User'})
                </Link>
              </div>
            ) : (
              <div className="border-t pt-2 mt-2 border-gray-100">
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

