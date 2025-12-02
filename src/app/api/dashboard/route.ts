import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface DateRange {
  start: string // ISO date string
  end: string // ISO date string
}

// Helper function to get week date range with offset
function getWeekRange(offset: number = 0): DateRange {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
  
  // Calculate current week's Sunday
  const currentSunday = new Date(today)
  currentSunday.setDate(today.getDate() - dayOfWeek)
  currentSunday.setHours(0, 0, 0, 0)
  
  // Apply offset (negative = go back in time)
  const targetSunday = new Date(currentSunday)
  targetSunday.setDate(currentSunday.getDate() + offset * 7)
  
  // Calculate Saturday (6 days after Sunday)
  const targetSaturday = new Date(targetSunday)
  targetSaturday.setDate(targetSunday.getDate() + 6)
  targetSaturday.setHours(23, 59, 59, 999)
  
  return {
    start: targetSunday.toISOString().split('T')[0],
    end: targetSaturday.toISOString().split('T')[0],
  }
}

// Helper function to get month date range with offset
function getMonthRange(offset: number = 0): DateRange {
  const today = new Date()
  const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// Helper function to get year date range with offset
function getYearRange(offset: number = 0): DateRange {
  const today = new Date()
  const targetYear = today.getFullYear() + offset
  
  const start = new Date(targetYear, 0, 1)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(targetYear, 11, 31)
  end.setHours(23, 59, 59, 999)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// GET - Fetch dashboard data for a specific period
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const periodType = searchParams.get('periodType') as 'week' | 'month' | 'year' | null
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!periodType || !['week', 'month', 'year'].includes(periodType)) {
      return NextResponse.json(
        { error: 'Invalid periodType. Must be week, month, or year' },
        { status: 400 }
      )
    }

    // Calculate date range based on period type and offset
    let dateRange: DateRange
    switch (periodType) {
      case 'week':
        dateRange = getWeekRange(offset)
        break
      case 'month':
        dateRange = getMonthRange(offset)
        break
      case 'year':
        dateRange = getYearRange(offset)
        break
    }

    // Fetch transactions in the date range
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        date,
        category_id,
        categories (
          id,
          name,
          category_type
        )
      `)
      .eq('user_id', user.id)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Fetch budget goals for the period type
    const { data: budgetGoals, error: goalsError } = await supabase
      .from('budget_goals')
      .select(`
        id,
        category_id,
        period_type,
        amount,
        categories (
          id,
          name,
          category_type
        )
      `)
      .eq('user_id', user.id)
      .eq('period_type', periodType)

    if (goalsError) {
      console.error('Error fetching budget goals:', goalsError)
      return NextResponse.json({ error: 'Failed to fetch budget goals' }, { status: 500 })
    }

    // Get earliest transaction date for navigation bounds
    const { data: earliestTransaction, error: earliestError } = await supabase
      .from('transactions')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(1)
      .single()

    // Calculate expenses and income by category
    const expensesByCategory: Record<string, number> = {}
    const incomeByCategory: Record<string, number> = {}
    let totalExpenses = 0
    let totalIncome = 0

    transactions?.forEach((transaction: any) => {
      const amount = Math.abs(Number(transaction.amount))
      const categoryName = transaction.categories?.name || 'Uncategorized'
      
      if (transaction.type === 'expense') {
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + amount
        totalExpenses += amount
      } else if (transaction.type === 'income') {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + amount
        totalIncome += amount
      }
    })

    // Match budget goals with actual spending
    const budgetData: Array<{
      id: string
      category: string
      categoryId: string
      budget: number
      spent: number
    }> = []

    budgetGoals?.forEach((goal: any) => {
      // Only include goals for expense categories
      if (goal.categories?.category_type !== 'expense') {
        return
      }

      const categoryName = goal.categories?.name || ''
      const spent = expensesByCategory[categoryName] || 0

      budgetData.push({
        id: goal.id,
        category: categoryName,
        categoryId: goal.category_id,
        budget: parseFloat(goal.amount),
        spent: spent,
      })
    })

    // Also include categories that have expenses but no budget goals
    Object.keys(expensesByCategory).forEach((categoryName) => {
      const hasGoal = budgetData.some((b) => b.category === categoryName)
      if (!hasGoal) {
        budgetData.push({
          id: '',
          category: categoryName,
          categoryId: '',
          budget: 0,
          spent: expensesByCategory[categoryName],
        })
      }
    })

    // Sort budget data by spent amount (descending)
    budgetData.sort((a, b) => b.spent - a.spent)

    // Prepare expense breakdown for pie chart (only categories with expenses)
    const expenseBreakdown = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Get the next period with data before the current period
    let nextPeriodWithData: string | null = null
    if (earliestTransaction) {
      const earliestDate = new Date(earliestTransaction.date)
      
      // Check which period contains the earliest transaction
      const earliestYear = earliestDate.getFullYear()
      const earliestMonth = earliestDate.getMonth()
      const earliestDay = earliestDate.getDate()
      
      // Find the period type that contains this date
      if (periodType === 'year') {
        nextPeriodWithData = earliestYear.toString()
      } else if (periodType === 'month') {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December']
        nextPeriodWithData = `${months[earliestMonth]} ${earliestYear}`
      } else if (periodType === 'week') {
        // For weeks, return the week string containing the earliest date
        const dayOfWeek = earliestDate.getDay()
        const weekStart = new Date(earliestDate)
        weekStart.setDate(earliestDate.getDate() - dayOfWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        const startStr = `${months[weekStart.getMonth()]} ${weekStart.getDate()}`
        const endStr = `${months[weekEnd.getMonth()]} ${weekEnd.getDate()}`
        nextPeriodWithData = `${startStr} - ${endStr}, ${weekStart.getFullYear()}`
      }
    }

    return NextResponse.json({
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      expenseBreakdown: expenseBreakdown.map((e) => ({
        label: e.category,
        amount: e.amount,
      })),
      budgetData: budgetData.map((b) => ({
        id: b.id,
        category: b.category,
        categoryId: b.categoryId,
        budget: b.budget,
        spent: b.spent,
      })),
      totals: {
        expenses: totalExpenses,
        income: totalIncome,
        net: totalIncome - totalExpenses,
      },
      earliestTransactionDate: earliestTransaction?.date || null,
      nextPeriodWithData: nextPeriodWithData,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

