import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all categories for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameter to filter by type (for goals page, we only want expenses)
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get('type') // 'expense' or 'income' or null for all

    // Build the query
    let query = supabase
      .from('categories')
      .select('id, name, category_type, created_at')
      .eq('user_id', user.id)
    
    // Filter by type if specified
    if (filterType === 'expense') {
      query = query.eq('category_type', 'expense')
    } else if (filterType === 'income') {
      query = query.eq('category_type', 'income')
    }
    
    const { data: categories, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new category
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category_type } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Validate category_type if provided
    if (category_type && !['income', 'expense'].includes(category_type)) {
      return NextResponse.json(
        { error: 'category_type must be either "income" or "expense"' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const type = category_type || 'expense' // Default to expense if not specified

    // Check if category already exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', trimmedName)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new records
      console.error('Error checking existing category:', checkError)
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      )
    }

    // Insert new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: trimmedName,
        category_type: type,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

