'use client'

import { useState } from 'react'
import { Link2, Plus, TrendingUp, Banknote, Wallet, CreditCard, FileText, ChevronRight, Edit, Lock, CheckCircle, Bell } from 'lucide-react'

interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit'
  institution: string
  accountNumber: string
  balance: number
  limit?: number
  status: 'active' | 'locked'
  lastInterest?: number
}

interface Transaction {
  id: string
  date: string
  description: string
  account: string
  accountNumber: string
  category: string
  amount: number
}

// Mock data - student accounts
const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Student Checking',
    type: 'checking',
    institution: 'Chase',
    accountNumber: '***8901',
    balance: 1247.83,
    status: 'active',
  },
  {
    id: '2',
    name: 'Savings Account',
    type: 'savings',
    institution: 'Chase',
    accountNumber: '***2234',
    balance: 3250.50,
    status: 'active',
    lastInterest: 2.15,
  },
  {
    id: '3',
    name: 'Student Credit Card',
    type: 'credit',
    institution: 'Discover',
    accountNumber: '***5432',
    balance: -287.45,
    limit: 2000.0,
    status: 'active',
  },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '11/27/2025',
    description: 'Textbook Purchase - Amazon',
    account: 'Credit Card',
    accountNumber: '5432',
    category: 'Textbooks',
    amount: -89.99,
  },
  {
    id: '2',
    date: '11/26/2025',
    description: 'Spotify Student Premium',
    account: 'Credit Card',
    accountNumber: '5432',
    category: 'Entertainment',
    amount: -4.99,
  },
  {
    id: '3',
    date: '11/25/2025',
    description: 'Part-time Job Paycheck',
    account: 'Checking',
    accountNumber: '8901',
    category: 'Income',
    amount: 320.0,
  },
  {
    id: '4',
    date: '11/24/2025',
    description: 'Campus Dining - Meal Plan',
    account: 'Checking',
    accountNumber: '8901',
    category: 'Food/Dining',
    amount: -12.50,
  },
  {
    id: '5',
    date: '11/23/2025',
    description: 'Uber to Campus',
    account: 'Credit Card',
    accountNumber: '5432',
    category: 'Transport',
    amount: -8.75,
  },
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Investment: { bg: 'bg-gray-100', text: 'text-gray-800' },
  Entertainment: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  Income: { bg: 'bg-green-100', text: 'text-green-800' },
  Groceries: { bg: 'bg-pink-100', text: 'text-pink-800' },
  Bills: { bg: 'bg-purple-100', text: 'text-purple-800' },
  Textbooks: { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Food/Dining': { bg: 'bg-orange-100', text: 'text-orange-800' },
  Transport: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
}

export default function AccountsPage() {
  const [hasLinkedAccounts] = useState(false) // No linked accounts - always show connection interface
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS)
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [showComingSoon, setShowComingSoon] = useState(false)

  // Calculate total net worth
  const totalNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0)
  const netWorthChange = 2.5 // Mock: +2.5% change

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Banknote className="w-6 h-6 text-blue-500" />
      case 'savings':
        return <Wallet className="w-6 h-6 text-green-500" />
      case 'credit':
        return <CreditCard className="w-6 h-6 text-red-500" />
      default:
        return <Banknote className="w-6 h-6 text-gray-500" />
    }
  }

  const getAccountBorderColor = (type: string) => {
    switch (type) {
      case 'checking':
        return 'border-blue-500'
      case 'savings':
        return 'border-green-500'
      case 'credit':
        return 'border-red-500'
      default:
        return 'border-gray-500'
    }
  }

  const getAccountTextColor = (type: string) => {
    switch (type) {
      case 'checking':
        return 'text-blue-600'
      case 'savings':
        return 'text-green-600'
      case 'credit':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // Always show bank connection interface with "coming soon" functionality
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-2xl border border-gray-100">
          {/* Header Section */}
          <div className="text-center mb-10">
            <Link2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-gray-900">Connect Financial Institutions</h1>
            <p className="mt-3 text-gray-600">
              Select your bank or broker to securely link your accounts for automated tracking.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              FinancePro uses secure, industry-leading partners for data connection.
            </p>
          </div>

          {/* Bank Grid */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-900">Popular Institutions</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Bank of America */}
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                  B
                </div>
                <span className="text-sm font-medium text-gray-700">Bank of America</span>
              </button>

              {/* Chase */}
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                  C
                </div>
                <span className="text-sm font-medium text-gray-700">Chase</span>
              </button>

              {/* Wells Fargo */}
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                  W
                </div>
                <span className="text-sm font-medium text-gray-700">Wells Fargo</span>
              </button>

              {/* Fidelity */}
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                  F
                </div>
                <span className="text-sm font-medium text-gray-700">Fidelity</span>
              </button>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex items-center justify-center w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-indigo-700 transition duration-200 shadow-md shadow-indigo-500/40"
              >
                <Link2 className="w-5 h-5 mr-3" />
                Connect to Another Bank
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-xs text-center text-gray-400">
            You will be redirected to your financial institution&apos;s website for authentication. Your login
            credentials are never stored by FinancePro.
          </p>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                This feature is currently under development. We&apos;re working hard to bring you secure bank account connections.
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

