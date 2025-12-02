'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  MinusCircle,
  PlusCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
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

// Helper function to get the date range for a period
function getPeriodDateRange(periodType: 'week' | 'month' | 'year', offset: number = 0): { start: Date; end: Date } {
  const today = new Date()
  
  switch (periodType) {
    case 'week': {
      const dayOfWeek = today.getDay()
      const currentSunday = new Date(today)
      currentSunday.setDate(today.getDate() - dayOfWeek)
      const targetSunday = new Date(currentSunday)
      targetSunday.setDate(currentSunday.getDate() + offset * 7)
      targetSunday.setHours(0, 0, 0, 0)
      
      const targetSaturday = new Date(targetSunday)
      targetSaturday.setDate(targetSunday.getDate() + 6)
      targetSaturday.setHours(23, 59, 59, 999)
      
      return { start: targetSunday, end: targetSaturday }
    }
    case 'month': {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1)
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    case 'year': {
      const targetYear = today.getFullYear() + offset
      const start = new Date(targetYear, 0, 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(targetYear, 11, 31)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
  }
}

// Helper function to calculate months difference
function getMonthsDifference(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth())
  return Math.abs(months)
}

interface DashboardData {
  expenseBreakdown: Array<{ label: string; amount: number }>
  budgetData: Array<{
    id: string
    category: string
    categoryId: string
    budget: number
    spent: number
  }>
  totals: {
    expenses: number
    income: number
    net: number
  }
  earliestTransactionDate: string | null
  nextPeriodWithData: string | null
}

// Color palette for pie chart
const PIE_COLORS = [
  '#4f46e5', // indigo
  '#f97316', // orange
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [currentPeriodType, setCurrentPeriodType] = useState<'week' | 'month' | 'year'>('week')
  const [untrackedStatements, setUntrackedStatements] = useState(0)
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0) // 0 = current period, negative = past
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [skipWarning, setSkipWarning] = useState<{
    show: boolean
    targetOffset: number
    targetPeriod: string
    skippedPeriods: number
    offsetWithData: number | null
  } | null>(null)
  const [earliestTransactionDate, setEarliestTransactionDate] = useState<string | null>(null)
  const [nextPeriodWithData, setNextPeriodWithData] = useState<string | null>(null)

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (periodType: 'week' | 'month' | 'year', offset: number) => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/dashboard?periodType=${periodType}&offset=${offset}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data: DashboardData = await response.json()
      setDashboardData(data)
      setEarliestTransactionDate(data.earliestTransactionDate)
      setNextPeriodWithData(data.nextPeriodWithData || null)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch data when period type or offset changes
  useEffect(() => {
    if (user) {
      fetchDashboardData(currentPeriodType, currentPeriodOffset)
    }
  }, [user, currentPeriodType, currentPeriodOffset, fetchDashboardData])

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

  // Check if we're at the current period (cannot go forward)
  const isCurrentPeriod = currentPeriodOffset === 0

  // Calculate the offset for the period containing the earliest transaction date
  const calculateOffsetForEarliestDate = (): number | null => {
    if (!earliestTransactionDate) return null
    
    const earliestDate = new Date(earliestTransactionDate)
    const today = new Date()
    
    switch (currentPeriodType) {
      case 'week': {
        const dayOfWeek = today.getDay()
        const currentSunday = new Date(today)
        currentSunday.setDate(today.getDate() - dayOfWeek)
        currentSunday.setHours(0, 0, 0, 0)
        
        const earliestDayOfWeek = earliestDate.getDay()
        const earliestSunday = new Date(earliestDate)
        earliestSunday.setDate(earliestDate.getDate() - earliestDayOfWeek)
        earliestSunday.setHours(0, 0, 0, 0)
        
        const diffDays = Math.floor((earliestSunday.getTime() - currentSunday.getTime()) / (1000 * 60 * 60 * 24))
        return Math.floor(diffDays / 7)
      }
      case 'month': {
        const earliestYear = earliestDate.getFullYear()
        const earliestMonth = earliestDate.getMonth()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth()
        
        return (earliestYear - currentYear) * 12 + (earliestMonth - currentMonth)
      }
      case 'year': {
        return earliestDate.getFullYear() - today.getFullYear()
      }
    }
  }

  // Check if we can go back (earliest transaction date check)
  const canGoBack = () => {
    if (!earliestTransactionDate) return false
    
    const currentRange = getPeriodDateRange(currentPeriodType, currentPeriodOffset)
    const earliestDate = new Date(earliestTransactionDate)
    
    // Check if the start of current period is after earliest date
    return currentRange.start > earliestDate
  }

  const hasPreviousData = canGoBack()

  // Check if there's data between current and target period
  const checkForDataGap = (targetOffset: number): { hasGap: boolean; skippedPeriods: number; nextPeriodWithData: string | null } => {
    if (!earliestTransactionDate || targetOffset >= currentPeriodOffset) {
      return { hasGap: false, skippedPeriods: 0, nextPeriodWithData: null }
    }

    // Calculate the offset for the period with the earliest transaction
    const offsetWithData = calculateOffsetForEarliestDate()
    if (offsetWithData === null) {
      return { hasGap: false, skippedPeriods: 0, nextPeriodWithData: null }
    }

    // Check if the target period would have data
    const targetRange = getPeriodDateRange(currentPeriodType, targetOffset)
    const earliestDate = new Date(earliestTransactionDate)
    earliestDate.setHours(0, 0, 0, 0)
    
    // Check if the target period contains the earliest date
    const targetContainsEarliest = targetRange.start <= earliestDate && targetRange.end >= earliestDate
    
    // If target period doesn't contain earliest date, there's a gap
    if (!targetContainsEarliest) {
      // If target offset is greater (closer to present) than offset with data, there's a gap
      // Example: targetOffset = -1, offsetWithData = -5 means we're skipping 4 periods
      if (targetOffset > offsetWithData) {
        const skippedPeriods = targetOffset - offsetWithData
        return { 
          hasGap: true, 
          skippedPeriods: skippedPeriods, 
          nextPeriodWithData: nextPeriodWithData 
        }
      }
      // If target is before the period with data, no gap (we can navigate there normally)
      return { hasGap: false, skippedPeriods: 0, nextPeriodWithData: null }
    }

    return { hasGap: false, skippedPeriods: 0, nextPeriodWithData: null }
  }

  const handlePrevPeriod = () => {
    const targetOffset = currentPeriodOffset - 1
    const gapCheck = checkForDataGap(targetOffset)

    if (gapCheck.hasGap && gapCheck.skippedPeriods > 0) {
      // Calculate the offset for the period that actually has data
      const offsetWithData = calculateOffsetForEarliestDate()
      
      // Use the offset with data as the target (this is where we'll navigate to)
      const finalOffset = offsetWithData ?? targetOffset
      
      // Calculate the target period string for the period with data
      const targetPeriod = gapCheck.nextPeriodWithData || (() => {
        switch (currentPeriodType) {
          case 'week':
            return getWeekPeriod(finalOffset)
          case 'month':
            return getMonthPeriod(finalOffset)
          case 'year':
            return getYearPeriod(finalOffset)
        }
      })()

      setSkipWarning({
        show: true,
        targetOffset: finalOffset, // This is where we'll navigate to
        targetPeriod, // This is the period string to display
        skippedPeriods: gapCheck.skippedPeriods,
        offsetWithData: offsetWithData, // Store the calculated offset with data
      })
    } else {
      setCurrentPeriodOffset(targetOffset)
    }
  }

  const handleNextPeriod = () => {
    // Only allow going forward if we're not at the current period
    if (currentPeriodOffset < 0) {
      setCurrentPeriodOffset(currentPeriodOffset + 1)
    }
  }

  const confirmSkip = () => {
    if (skipWarning) {
      // Navigate to the period that actually has data
      const offsetToUse = skipWarning.offsetWithData ?? skipWarning.targetOffset
      setCurrentPeriodOffset(offsetToUse)
      setSkipWarning(null)
    }
  }

  const cancelSkip = () => {
    // Just close the warning, stay on current period
    setSkipWarning(null)
  }

  const handleAddData = () => {
    setIsTransactionModalOpen(true)
  }

  const handleSaveTransaction = () => {
    // Refresh data when transaction is saved
    fetchDashboardData(currentPeriodType, currentPeriodOffset)
    // Decrease untracked count when transaction is saved from statements tab
    if (untrackedStatements > 0) {
      setUntrackedStatements(untrackedStatements - 1)
    }
  }

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  // Prepare chart data from dashboard data
  const periodString = getPeriodString()
  const expenseBreakdown = dashboardData?.expenseBreakdown || []
  const budgetData = dashboardData?.budgetData || []
  const totals = dashboardData?.totals || { expenses: 0, income: 0, net: 0 }

  const totalSpent = totals.expenses
  const totalBudget = budgetData.reduce((sum, item) => sum + item.budget, 0)
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  // Pie chart data - expense breakdown
  const pieChartData = {
    labels: expenseBreakdown.map((e) => e.label),
    datasets: [
      {
        data: expenseBreakdown.map((e) => e.amount),
        backgroundColor: PIE_COLORS.slice(0, expenseBreakdown.length),
        hoverOffset: 10,
        borderWidth: 0,
      },
    ],
  }

  // Budget colors based on utilization: Green <50%, Yellow 50-90%, Red ≥90%
  const getBudgetColors = (spent: number[], budgets: number[]) => {
    return spent.map((expense, i) => {
      const budget = budgets[i]
      if (!budget || budget === 0) return '#9ca3af' // Gray for no budget
      const util = (expense / budget) * 100
      if (util >= 90) return '#ef4444' // Red (≥90%)
      if (util >= 50) return '#f59e0b' // Yellow (50-90%)
      return '#10b981' // Green (<50%)
    })
  }

  const spentColors = getBudgetColors(
    budgetData.map((b) => b.spent),
    budgetData.map((b) => b.budget)
  )

  // Filter out categories with no budget for the bar chart
  const budgetDataWithBudgets = budgetData.filter((b) => b.budget > 0)
  
  // Bar chart data - budget vs spent (only for categories with budgets)
  const barChartData = {
    labels: budgetDataWithBudgets.map((b) => b.category),
    datasets: [
      {
        label: 'Amount Spent',
        data: budgetDataWithBudgets.map((b) => b.spent),
        backgroundColor: getBudgetColors(
          budgetDataWithBudgets.map((b) => b.spent),
          budgetDataWithBudgets.map((b) => b.budget)
        ),
        stack: 'stack1',
        borderRadius: 4,
        maxBarThickness: 24,
      },
      {
        label: 'Remaining Budget',
        data: budgetDataWithBudgets.map((b) => Math.max(0, b.budget - b.spent)),
        backgroundColor: '#e5e7eb',
        stack: 'stack1',
        borderRadius: 4,
        maxBarThickness: 24,
      },
    ],
  }

  // Main category for pie chart
  const mainCategory = expenseBreakdown.length > 0 ? expenseBreakdown[0].label : 'None'

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      {/* Skip Warning Modal */}
      {skipWarning?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Skip to Period with Data?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  The last date with data is <strong>{skipWarning.targetPeriod}</strong>. Would you like to proceed?
                </p>
              </div>
              <button
                onClick={cancelSkip}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelSkip}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmSkip}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Expense Pie Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Expense Breakdown</h2>
                {expenseBreakdown.length > 0 ? (
                  <>
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
                      <span className="text-indigo-600">Main Category: {mainCategory}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center h-96">
                    <p className="text-gray-400">No expenses in this period</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-1 space-y-6">
                {/* Total Outflow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <MinusCircle className="w-4 h-4 mr-2 text-red-500" />
                    Total Outflow
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    ${totalSpent.toFixed(2)}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">Total expenses</span>
                </div>

                {/* Total Inflow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <PlusCircle className="w-4 h-4 mr-2 text-green-500" />
                    Total Inflow
                  </p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">Total income</span>
                </div>

                {/* Net Flow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Wallet className="w-4 h-4 mr-2 text-indigo-600" />
                    Net Flow
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${totals.net >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    ${totals.net.toFixed(2)}
                  </p>
                  <span className="text-xs text-gray-500 mt-2 block">
                    {totals.net >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Goal Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>Budget Goal Progress</span>
                {totalBudget > 0 && (
                  <span className={`text-sm font-semibold ${
                    utilization >= 95 ? 'text-red-500' : utilization > 80 ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {utilization}% Utilized
                  </span>
                )}
              </h2>
              {budgetDataWithBudgets.length > 0 ? (
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
              ) : (
                <div className="w-full h-80 flex items-center justify-center">
                  <p className="text-gray-400">No budget goals set for this period</p>
                </div>
              )}
            </div>
          </>
        )}
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
