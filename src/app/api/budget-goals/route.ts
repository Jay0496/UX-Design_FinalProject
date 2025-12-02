import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all budget goals grouped by period
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all budget goals for the user with category information
    const { data: budgetGoals, error } = await supabase
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
      .order('period_type', { ascending: true })
      .order('amount', { ascending: false })

    if (error) {
      console.error('Error fetching budget goals:', error)
      return NextResponse.json({ error: 'Failed to fetch budget goals' }, { status: 500 })
    }

    // Group by period type and filter out income categories
    const grouped: {
      week: Array<{ id: string; category: string; categoryId: string; amount: number }>
      month: Array<{ id: string; category: string; categoryId: string; amount: number }>
      year: Array<{ id: string; category: string; categoryId: string; amount: number }>
    } = {
      week: [],
      month: [],
      year: [],
    }

    budgetGoals?.forEach((goal: any) => {
      // Only include goals for expense categories
      if (goal.categories?.category_type !== 'expense') {
        return
      }

      const item = {
        id: goal.id,
        category: goal.categories?.name || '',
        categoryId: goal.category_id,
        amount: parseFloat(goal.amount),
      }

      if (goal.period_type === 'week') {
        grouped.week.push(item)
      } else if (goal.period_type === 'month') {
        grouped.month.push(item)
      } else if (goal.period_type === 'year') {
        grouped.year.push(item)
      }
    })

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update a budget goal
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { categoryId, periodType, amount, goalId } = body

    if (!categoryId || !periodType || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, periodType, amount' },
        { status: 400 }
      )
    }

    if (!['week', 'month', 'year'].includes(periodType)) {
      return NextResponse.json(
        { error: 'Invalid periodType. Must be week, month, or year' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate that the category exists and is an expense category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, category_type')
      .eq('id', categoryId)
      .eq('user_id', user.id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.category_type !== 'expense') {
      return NextResponse.json(
        { error: 'Budget goals can only be set for expense categories' },
        { status: 400 }
      )
    }

    // Check if updating existing goal or creating new one
    let existing = null
    if (goalId && !goalId.startsWith('temp-')) {
      // Check if this is an existing goal we're updating
      const { data, error: checkError } = await supabase
        .from('budget_goals')
        .select('id, category_id, period_type')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single()

      if (!checkError && data) {
        existing = data
      }
    }

    // If not updating existing goal, check if goal already exists for this category+period combo
    if (!existing) {
      const { data: existingByCategory, error: checkError } = await supabase
        .from('budget_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('period_type', periodType)
        .single()

      if (!checkError && existingByCategory) {
        existing = existingByCategory
      }
    }

    let result
    if (existing) {
      // Update existing goal
      const { data, error } = await supabase
        .from('budget_goals')
        .update({ 
          category_id: categoryId,
          amount, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating budget goal:', error)
        return NextResponse.json({ error: 'Failed to update budget goal' }, { status: 500 })
      }
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('budget_goals')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          period_type: periodType,
          amount,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating budget goal:', error)
        return NextResponse.json({ error: 'Failed to create budget goal' }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a budget goal
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const { error } = await supabase
      .from('budget_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting budget goal:', error)
      return NextResponse.json({ error: 'Failed to delete budget goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

