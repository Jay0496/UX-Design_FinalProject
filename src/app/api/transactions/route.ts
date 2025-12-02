import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all transactions for the current user, ordered by date (latest first)
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all transactions with category information
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        date,
        account,
        notes,
        debt_id,
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false }) // Latest first

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Transform to include category name
    const transactionsWithCategory = transactions?.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      date: t.date,
      account: t.account || '',
      notes: t.notes || '',
      debt_id: t.debt_id,
      category_id: t.category_id,
      category: t.categories ? (t.categories as any).name : null,
    })) || []

    return NextResponse.json(transactionsWithCategory)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new transaction
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, amount, date, category_id, account, notes, debt_id } = body

    // Validation
    if (!type || !['expense', 'income'].includes(type)) {
      return NextResponse.json(
        { error: 'Transaction type must be "expense" or "income"' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // If debt_id is provided, validate the debt and payment
    if (debt_id) {
      // Fetch the debt
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('id, name, principal, start_date')
        .eq('id', debt_id)
        .eq('user_id', user.id)
        .single()

      if (debtError || !debt) {
        return NextResponse.json(
          { error: 'Loan not found' },
          { status: 404 }
        )
      }

      // Validate payment date is not before loan start date
      if (new Date(date) < new Date(debt.start_date)) {
        return NextResponse.json(
          { error: `Payment date cannot be before loan start date (${debt.start_date})` },
          { status: 400 }
        )
      }

      // Calculate remaining balance
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('debt_id', debt_id)
        .eq('user_id', user.id)

      if (paymentsError) {
        console.error('Error fetching existing payments:', paymentsError)
      }

      const totalPaid = existingPayments?.reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0) || 0
      const remainingBalance = Number(debt.principal) - totalPaid

      // Validate payment doesn't make balance go below 0
      if (amount > remainingBalance) {
        return NextResponse.json(
          { error: `Payment amount ($${amount.toFixed(2)}) exceeds remaining balance ($${remainingBalance.toFixed(2)})` },
          { status: 400 }
        )
      }
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        date,
        category_id,
        account: account || null,
        notes: notes || null,
        debt_id: debt_id || null,
      })
      .select(`
        id,
        type,
        amount,
        date,
        account,
        notes,
        debt_id,
        category_id,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // Transform response
    const transactionWithCategory = {
      id: data.id,
      type: data.type,
      amount: data.amount,
      date: data.date,
      account: data.account || '',
      notes: data.notes || '',
      debt_id: data.debt_id,
      category_id: data.category_id,
      category: data.categories ? (data.categories as any).name : null,
    }

    return NextResponse.json(transactionWithCategory, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing transaction
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type, amount, date, category_id, account, notes, debt_id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Validate type if provided
    if (type && !['expense', 'income'].includes(type)) {
      return NextResponse.json(
        { error: 'Transaction type must be "expense" or "income"' },
        { status: 400 }
      )
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Fetch existing transaction to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('id, debt_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If debt_id is being updated, validate it
    if (debt_id !== undefined && debt_id !== null) {
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('id, name, principal, start_date')
        .eq('id', debt_id)
        .eq('user_id', user.id)
        .single()

      if (debtError || !debt) {
        return NextResponse.json(
          { error: 'Loan not found' },
          { status: 404 }
        )
      }

      const paymentDate = date || existing.date
      if (new Date(paymentDate) < new Date(debt.start_date)) {
        return NextResponse.json(
          { error: `Payment date cannot be before loan start date (${debt.start_date})` },
          { status: 400 }
        )
      }

      // Calculate remaining balance excluding this transaction
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('debt_id', debt_id)
        .eq('user_id', user.id)
        .neq('id', id) // Exclude current transaction

      if (paymentsError) {
        console.error('Error fetching existing payments:', paymentsError)
      }

      const totalPaid = existingPayments?.reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0) || 0
      const remainingBalance = Number(debt.principal) - totalPaid
      const paymentAmount = amount || Math.abs(existing.amount || 0)

      if (paymentAmount > remainingBalance) {
        return NextResponse.json(
          { error: `Payment amount ($${paymentAmount.toFixed(2)}) exceeds remaining balance ($${remainingBalance.toFixed(2)})` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) {
      updateData.amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
    }
    if (date !== undefined) updateData.date = date
    if (category_id !== undefined) updateData.category_id = category_id
    if (account !== undefined) updateData.account = account || null
    if (notes !== undefined) updateData.notes = notes || null
    if (debt_id !== undefined) updateData.debt_id = debt_id || null

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        id,
        type,
        amount,
        date,
        account,
        notes,
        debt_id,
        category_id,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    // Transform response
    const transactionWithCategory = {
      id: data.id,
      type: data.type,
      amount: data.amount,
      date: data.date,
      account: data.account || '',
      notes: data.notes || '',
      debt_id: data.debt_id,
      category_id: data.category_id,
      category: data.categories ? (data.categories as any).name : null,
    }

    return NextResponse.json(transactionWithCategory)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a transaction
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
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Delete transaction (only if owned by user)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting transaction:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

