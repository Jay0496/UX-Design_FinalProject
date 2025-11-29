'use client'

import { useState } from 'react'
import { Link2, Plus, Search, TrendingUp, Banknote, Wallet, CreditCard, FileText, ChevronRight, Edit, Lock, CheckCircle, Bell } from 'lucide-react'

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
  const [hasLinkedAccounts] = useState(true) // Mock: always show linked accounts
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS)
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLinkAccount, setShowLinkAccount] = useState(false)

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

  // Show bank connection interface if no accounts or if "Link New Account" was clicked
  if (!hasLinkedAccounts || showLinkAccount) {
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
              {showLinkAccount && (
                <button
                  onClick={() => setShowLinkAccount(false)}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Back to Accounts
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
              <input
                type="text"
                placeholder="Search for your bank or broker"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Bank Grid */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-gray-900">Popular Institutions</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Bank of America */}
                <button
                  onClick={() => {
                    alert('Redirecting to Bank of America for secure authentication...\n\nYou will be redirected to your bank\'s login page to securely connect your account.')
                  }}
                  className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                    B
                  </div>
                  <span className="text-sm font-medium text-gray-700">Bank of America</span>
                </button>

                {/* Chase */}
                <button
                  onClick={() => {
                    alert('Redirecting to Chase for secure authentication...\n\nYou will be redirected to your bank\'s login page to securely connect your account.')
                  }}
                  className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                    C
                  </div>
                  <span className="text-sm font-medium text-gray-700">Chase</span>
                </button>

                {/* Wells Fargo */}
                <button
                  onClick={() => {
                    alert('Redirecting to Wells Fargo for secure authentication...\n\nYou will be redirected to your bank\'s login page to securely connect your account.')
                  }}
                  className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                    W
                  </div>
                  <span className="text-sm font-medium text-gray-700">Wells Fargo</span>
                </button>

                {/* Fidelity */}
                <button
                  onClick={() => {
                    alert('Redirecting to Fidelity for secure authentication...\n\nYou will be redirected to your bank\'s login page to securely connect your account.')
                  }}
                  className="flex flex-col items-center justify-center p-4 h-32 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                    F
                  </div>
                  <span className="text-sm font-medium text-gray-700">Fidelity</span>
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-gray-500 text-sm mb-4">Don&apos;t see your bank listed?</p>
                <button
                  onClick={() => {
                    alert('Opening manual connection form...\n\nYou can manually enter your account details to connect.')
                  }}
                  className="flex items-center justify-center w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-indigo-700 transition duration-200 shadow-md shadow-indigo-500/40"
                >
                  <Edit className="w-5 h-5 mr-3" />
                  Connect Manually
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
      </main>
    )
  }

  // Show "Linked Accounts" view
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header and Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Linked Accounts</h1>
          <button
            onClick={() => setShowLinkAccount(true)}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-600 transition duration-200 shadow-md shadow-green-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Link New Account
          </button>
        </div>

        {/* Net Worth Summary Card */}
        <div className="mb-8 bg-indigo-600 text-white p-6 rounded-xl shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium opacity-80">Total Net Worth</p>
              <h2 className="text-4xl font-black mt-1">
                {formatCurrency(totalNetWorth).replace(/\d+$/, '')}
                <span className="text-xl opacity-80">
                  {formatCurrency(totalNetWorth).split('.')[1]}
                </span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium flex items-center justify-end">
                <TrendingUp className="w-4 h-4 mr-1 text-green-300" />
                Last 30 Days
              </p>
              <p className="text-lg font-semibold text-green-300">+{netWorthChange}%</p>
            </div>
          </div>
        </div>

        {/* Linked Accounts Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Accounts Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card bg-white p-6 rounded-xl shadow-lg border-t-4 ${getAccountBorderColor(account.type)} hover:transform hover:-translate-y-1 transition-all duration-200 hover:shadow-xl`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-semibold ${getAccountTextColor(account.type)}`}>
                  {account.name}
                </span>
                {getAccountIcon(account.type)}
              </div>
              <p className="text-xs text-gray-400">
                {account.institution} ({account.accountNumber})
              </p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  account.balance < 0 ? 'text-red-600' : ''
                }`}
              >
                {formatCurrency(Math.abs(account.balance)).replace(/\d+$/, '')}
                <span className={`text-xl ${account.balance < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {formatCurrency(Math.abs(account.balance)).split('.')[1]}
                </span>
              </p>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>
                  {account.type === 'credit' && account.limit
                    ? `Limit: ${formatCurrency(account.limit)}`
                    : account.lastInterest
                    ? `Last Interest: ${formatCurrency(account.lastInterest)}`
                    : 'Available'}
                </span>
                {account.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : account.type === 'credit' ? (
                  <Bell className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity (Statements)</h2>
          <a
            href="#"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            View All Transactions
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr>
                <th className="w-1/12 text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200">
                  Date
                </th>
                <th className="w-4/12 text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200">
                  Description
                </th>
                <th className="w-2/12 text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200">
                  Account
                </th>
                <th className="w-2/12 text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200">
                  Category
                </th>
                <th className="w-2/12 text-right py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200">
                  Amount
                </th>
                <th className="w-1/12 text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-600">{transaction.date}</td>
                  <td className="py-4 px-4 font-medium text-gray-800">{transaction.description}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {transaction.account} ({transaction.accountNumber})
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        CATEGORY_COLORS[transaction.category]?.bg || 'bg-gray-100'
                      } ${
                        CATEGORY_COLORS[transaction.category]?.text || 'text-gray-800'
                      }`}
                    >
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-semibold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-4 px-4">
                    <FileText className="w-4 h-4 text-gray-400 cursor-pointer hover:text-indigo-600" title="View Statement" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .account-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
      `}</style>
    </main>
  )
}

