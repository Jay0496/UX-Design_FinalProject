import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all debts for the current user with payment history
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all debts for the user
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (debtsError) {
      console.error('Error fetching debts:', debtsError)
      return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 })
    }

    // Fetch all debt payments (transactions with debt_id) for these debts
    const debtIds = debts?.map(d => d.id) || []
    let payments: any[] = []
    
    if (debtIds.length > 0) {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, debt_id, amount, date')
        .eq('user_id', user.id)
        .in('debt_id', debtIds)
        .order('date', { ascending: true })

      if (transactionsError) {
        console.error('Error fetching debt payments:', transactionsError)
      } else {
        payments = transactions || []
      }
    }

    // Combine debts with their payments
    const debtsWithPayments = debts?.map(debt => {
      const debtPayments = payments
        .filter(p => p.debt_id === debt.id)
        .map(p => ({
          date: p.date,
          amount: Math.abs(Number(p.amount)), // Payments are negative, convert to positive
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return {
        id: debt.id,
        name: debt.name,
        principal: Number(debt.principal),
        interestRate: Number(debt.interest_rate),
        interestPeriod: debt.interest_period || 'monthly',
        startDate: debt.start_date,
        interestStartDate: debt.interest_start_date || debt.start_date,
        payments: debtPayments,
      }
    }) || []

    return NextResponse.json(debtsWithPayments)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new debt
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, principal, interestRate, interestPeriod, startDate, interestStartDate } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Debt name is required' },
        { status: 400 }
      )
    }

    if (principal === undefined || principal === null || principal < 0) {
      return NextResponse.json(
        { error: 'Principal amount must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    if (interestRate === undefined || interestRate === null || interestRate < 0) {
      return NextResponse.json(
        { error: 'Interest rate must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // Validate interest period
    const validPeriods = ['daily', 'monthly', 'annually']
    const period = interestPeriod || 'monthly'
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Interest period must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      )
    }

    // Use interestStartDate if provided, otherwise default to startDate
    const finalInterestStartDate = interestStartDate || startDate

    // Insert new debt
    const { data, error } = await supabase
      .from('debts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        principal: principal,
        interest_rate: interestRate,
        interest_period: period,
        start_date: startDate,
        interest_start_date: finalInterestStartDate,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating debt:', error)
      return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      principal: Number(data.principal),
      interestRate: Number(data.interest_rate),
      interestPeriod: data.interest_period,
      startDate: data.start_date,
      interestStartDate: data.interest_start_date,
      payments: [],
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing debt
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, principal, interestRate, interestPeriod, startDate, interestStartDate } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Debt ID is required' },
        { status: 400 }
      )
    }

    // Verify the debt belongs to the user
    const { data: existingDebt, error: checkError } = await supabase
      .from('debts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingDebt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Debt name must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (principal !== undefined) {
      if (principal < 0) {
        return NextResponse.json(
          { error: 'Principal amount must be greater than or equal to 0' },
          { status: 400 }
        )
      }
      updateData.principal = principal
    }

    if (interestRate !== undefined) {
      if (interestRate < 0) {
        return NextResponse.json(
          { error: 'Interest rate must be greater than or equal to 0' },
          { status: 400 }
        )
      }
      updateData.interest_rate = interestRate
    }

    if (interestPeriod !== undefined) {
      const validPeriods = ['daily', 'monthly', 'annually']
      if (!validPeriods.includes(interestPeriod)) {
        return NextResponse.json(
          { error: `Interest period must be one of: ${validPeriods.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.interest_period = interestPeriod
    }

    if (startDate !== undefined) {
      updateData.start_date = startDate
    }

    if (interestStartDate !== undefined) {
      updateData.interest_start_date = interestStartDate
    }

    // Update the debt
    const { data, error } = await supabase
      .from('debts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating debt:', error)
      return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 })
    }

    // Fetch payments for this debt
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, amount, date')
      .eq('user_id', user.id)
      .eq('debt_id', id)
      .order('date', { ascending: true })

    const debtPayments = (transactions || []).map(p => ({
      date: p.date,
      amount: Math.abs(Number(p.amount)),
    }))

    return NextResponse.json({
      id: data.id,
      name: data.name,
      principal: Number(data.principal),
      interestRate: Number(data.interest_rate),
      interestPeriod: data.interest_period,
      startDate: data.start_date,
      interestStartDate: data.interest_start_date,
      payments: debtPayments,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a debt
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
        { error: 'Debt ID is required' },
        { status: 400 }
      )
    }

    // Verify the debt belongs to the user
    const { data: existingDebt, error: checkError } = await supabase
      .from('debts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingDebt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      )
    }

    // Delete the debt (cascade will handle related transactions)
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting debt:', error)
      return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

