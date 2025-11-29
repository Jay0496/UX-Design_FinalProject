'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getCategories } from '@/lib/categories'
import {
  Plus,
  MinusCircle,
  PlusCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import TransactionModal from '@/components/TransactionModal'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

// Helper function to format dates
function formatDate(date: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

// Helper function to get week period with offset (0 = current week, negative = past weeks)
function getWeekPeriod(offset: number = 0): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
  
  // Calculate current week's Sunday
  const currentSunday = new Date(today)
  currentSunday.setDate(today.getDate() - dayOfWeek)
  
  // Apply offset (negative = go back in time)
  const targetSunday = new Date(currentSunday)
  targetSunday.setDate(currentSunday.getDate() + offset * 7)
  
  // Calculate Saturday (6 days after Sunday)
  const targetSaturday = new Date(targetSunday)
  targetSaturday.setDate(targetSunday.getDate() + 6)

  const sundayYear = targetSunday.getFullYear()
  const saturdayYear = targetSaturday.getFullYear()

  if (sundayYear === saturdayYear) {
    return `${formatDate(targetSunday)} - ${formatDate(targetSaturday)}, ${sundayYear}`
  } else {
    return `${formatDate(targetSunday)}, ${sundayYear} - ${formatDate(targetSaturday)}, ${saturdayYear}`
  }
}

// Helper function to get month period with offset (0 = current month, negative = past months)
function getMonthPeriod(offset: number = 0): string {
  const today = new Date()
  const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`
}

// Helper function to get year period with offset (0 = current year, negative = past years)
function getYearPeriod(offset: number = 0): string {
  const today = new Date()
  return `${today.getFullYear() + offset}`
}

// Mock data - student expenses (period will be calculated dynamically based on offset)
const MOCK_DATA = {
  week: {
    expenses: [45, 85, 25, 30, 15],
    labels: ['Groceries', 'Food/Dining', 'Coffee', 'Transport', 'Entertainment'],
    budgets: [60, 100, 30, 40, 50],
  },
  month: {
    expenses: [180, 340, 100, 120, 200],
    labels: ['Rent', 'Groceries', 'Textbooks', 'Transport', 'Entertainment'],
    budgets: [600, 200, 150, 150, 250],
  },
  year: {
    expenses: [7200, 4080, 1200, 1440, 2400],
    labels: ['Rent', 'Groceries', 'Textbooks', 'Transportation', 'Entertainment'],
    budgets: [7200, 2400, 1800, 1800, 3000],
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [currentPeriodType, setCurrentPeriodType] = useState<'week' | 'month' | 'year'>('week')
  const [untrackedStatements, setUntrackedStatements] = useState(3)
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0) // 0 = current period, negative = past
  const [categories, setCategories] = useState<string[]>([])

  // Load categories and listen for updates from Goals page
  useEffect(() => {
    const loadCategories = () => {
      setCategories(getCategories())
    }
    
    loadCategories()
    
    // Listen for category updates
    window.addEventListener('categories-updated', loadCategories)
    
    return () => {
      window.removeEventListener('categories-updated', loadCategories)
    }
  }, [])

  // Check if we're at the current period (cannot go forward)
  const isCurrentPeriod = currentPeriodOffset === 0

  // Check if there's previous data (for now, allow going back, but structure for future data checks)
  // When real data is implemented, check if there's data for the previous period
  const hasPreviousData = true // TODO: Replace with actual data check when fetching real data

  // Calculate period string based on type and offset
  const getPeriodString = (): string => {
    switch (currentPeriodType) {
      case 'week':
        return getWeekPeriod(currentPeriodOffset)
      case 'month':
        return getMonthPeriod(currentPeriodOffset)
      case 'year':
        return getYearPeriod(currentPeriodOffset)
      default:
        return ''
    }
  }

  // Get data - use categories from goals if available, otherwise use mock data
  // For now, we'll use mock data but structure it to support dynamic categories
  const data = MOCK_DATA[currentPeriodType]
  
  // TODO: When real data is implemented, filter/update data based on categories from goals page
  const periodString = getPeriodString()
  const totalSpent = data.expenses.reduce((sum, val) => sum + val, 0)
  const totalBudget = data.budgets.reduce((sum, val) => sum + val, 0)
  const incomeMock =
    currentPeriodType === 'week' ? 320.0 : currentPeriodType === 'month' ? 1280.0 : 15360.0 // Part-time job income
  const netFlow = incomeMock - totalSpent
  const utilization = Math.round((totalSpent / totalBudget) * 100)

  // Pie chart data
  const pieChartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.expenses,
        backgroundColor: ['#4f46e5', '#f97316', '#10b981', '#3b82f6', '#ef4444'],
        hoverOffset: 10,
        borderWidth: 0,
      },
    ],
  }

  // Budget colors based on utilization: Green ≤80%, Yellow 80-95%, Red ≥95%
  const getBudgetColors = (expenses: number[], budgets: number[]) => {
    return expenses.map((expense, i) => {
      const budget = budgets[i]
      const util = (expense / budget) * 100
      if (util >= 95) return '#ef4444' // Red (≥95%)
      if (util > 80) return '#f59e0b' // Yellow (80-95%)
      return '#10b981' // Green (≤80%)
    })
  }

  const spentColors = getBudgetColors(data.expenses, data.budgets)

  // Bar chart data
  const barChartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Amount Spent',
        data: data.expenses,
        backgroundColor: spentColors,
        stack: 'stack1',
        borderRadius: 4,
        maxBarThickness: 24,
      },
      {
        label: 'Remaining Budget',
        data: data.budgets.map((budget, i) => Math.max(0, budget - data.expenses[i])),
        backgroundColor: '#e5e7eb',
        stack: 'stack1',
        borderRadius: 4,
        maxBarThickness: 24,
      },
    ],
  }

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  const handleAddData = () => {
    setIsTransactionModalOpen(true)
  }

  const handleSaveTransaction = () => {
    // Decrease untracked count when transaction is saved from statements tab
    if (untrackedStatements > 0) {
      setUntrackedStatements(untrackedStatements - 1)
    }
  }

  const handlePrevPeriod = () => {
    if (hasPreviousData) {
      setCurrentPeriodOffset(currentPeriodOffset - 1)
      // TODO: When fetching real data, load data for the previous period
    }
  }

  const handleNextPeriod = () => {
    // Only allow going forward if we're not at the current period
    if (currentPeriodOffset < 0) {
      setCurrentPeriodOffset(currentPeriodOffset + 1)
      // TODO: When fetching real data, load data for the next period
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      {/* Floating Action Button */}
      <div className="fixed top-20 right-5 z-50">
        <div className="relative">
          <button
            onClick={handleAddData}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105"
            title="Add or Categorize Data"
          >
            <Plus className="w-8 h-8" />
          </button>
          {untrackedStatements > 0 && (
            <span className="absolute -top-1 -right-1 min-w-6 h-6 bg-amber-300 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-md">
              {untrackedStatements > 99 ? '99+' : untrackedStatements}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Period Selection */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6 hidden sm:block">
            Financial Dashboard
          </h1>

          {/* Period Tabs */}
          <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-inner border border-gray-200 mb-6">
            <button
              onClick={() => {
                setCurrentPeriodType('week')
                setCurrentPeriodOffset(0) // Reset to current period when switching
              }}
              className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                currentPeriodType === 'week'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => {
                setCurrentPeriodType('month')
                setCurrentPeriodOffset(0) // Reset to current period when switching
              }}
              className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                currentPeriodType === 'month'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => {
                setCurrentPeriodType('year')
                setCurrentPeriodOffset(0) // Reset to current period when switching
              }}
              className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                currentPeriodType === 'year'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Year
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center space-x-4">
            {hasPreviousData ? (
              <button
                onClick={handlePrevPeriod}
                className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                title="Previous Period"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            ) : (
              <div className="w-10 h-10" /> // Spacer to maintain layout
            )}
            <span className="text-2xl font-extrabold text-gray-800 w-64 text-center">
              {periodString}
            </span>
            {!isCurrentPeriod ? (
              <button
                onClick={handleNextPeriod}
                className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                title="Next Period"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            ) : (
              <div className="w-10 h-10" /> // Spacer to maintain layout
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Pie Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Expense Breakdown</h2>
            <div className="flex-grow relative h-96">
              <Doughnut
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        font: { family: 'Inter' },
                        boxWidth: 12,
                        usePointStyle: true,
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center text-sm font-medium space-x-4">
              <span className="text-red-600">Total Spent: ${totalSpent.toFixed(2)}</span>
              <span className="text-gray-500 hidden sm:inline">|</span>
              <span className="text-indigo-600">Main Category: {data.labels[0]}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Total Outflow */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                <MinusCircle className="w-4 h-4 mr-2 text-red-500" />
                Total Outflow
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">${totalSpent.toFixed(2)}</p>
              <span className="text-xs text-red-500 mt-2 block">+$12.50 vs last period</span>
            </div>

            {/* Total Inflow */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                <PlusCircle className="w-4 h-4 mr-2 text-green-500" />
                Total Inflow
              </p>
              <p className="text-3xl font-bold text-green-500 mt-1">
                ${incomeMock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-gray-400 mt-2 block">Expected Salary Deposit</span>
            </div>

            {/* Net Flow */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                <Wallet className="w-4 h-4 mr-2 text-indigo-600" />
                Net Flow
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">${netFlow.toFixed(2)}</p>
              <span className="text-xs text-gray-500 mt-2 block">
                {netFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Goal Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span>Budget Goal Progress</span>
            <span className={`text-sm font-semibold ${
              utilization >= 95 ? 'text-red-500' : utilization > 80 ? 'text-amber-500' : 'text-green-500'
            }`}>
              {utilization}% Utilized
            </span>
          </h2>
          <div className="w-full h-80">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { display: true },
                    ticks: {
                      callback: (value) => '$' + Number(value).toLocaleString(),
                    },
                  },
                  y: {
                    stacked: true,
                    grid: { display: false },
                  },
                },
                plugins: {
                  legend: { position: 'top', labels: { font: { family: 'Inter' } } },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        return (
                          context.dataset.label +
                          ': ' +
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(context.parsed.x)
                        )
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
        untrackedCount={untrackedStatements}
        onDeleteStatement={handleSaveTransaction}
      />
    </div>
  )
}
