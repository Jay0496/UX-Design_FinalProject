'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Calendar, Calculator, Loader2, X } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Payment {
  date: string
  amount: number
}

interface Debt {
  id: string
  name: string
  principal: number
  interestRate: number
  interestPeriod: 'daily' | 'monthly' | 'annually'
  startDate: string
  interestStartDate: string
  payments: Payment[]
}

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [selectedDebtId, setSelectedDebtId] = useState<string>('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDebt, setEditedDebt] = useState<Partial<Debt> | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map())
  const [newDebtForm, setNewDebtForm] = useState<Partial<Debt>>({
    name: 'New Debt',
    principal: 1000,
    interestRate: 5.0,
    interestPeriod: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    interestStartDate: new Date().toISOString().split('T')[0],
    payments: [],
  })

  // Fetch debts from API
  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/debts')
      if (!response.ok) {
        throw new Error('Failed to fetch debts')
      }
      const data = await response.json()
      setDebts(data)
      if (data.length > 0 && !selectedDebtId) {
        setSelectedDebtId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDebt = debts.find((d) => d.id === selectedDebtId)

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  // Format percentage
  const formatPercent = (rate: number): string => {
    return `${rate.toFixed(2)}%`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Calculate interest based on period
  const calculateInterest = (
    principal: number,
    rate: number,
    period: 'daily' | 'monthly' | 'annually',
    days: number
  ): number => {
    const annualRate = rate / 100
    let periodsPerYear: number

    switch (period) {
      case 'daily':
        periodsPerYear = 365
        break
      case 'monthly':
        periodsPerYear = 12
        break
      case 'annually':
        periodsPerYear = 1
        break
    }

    // Calculate number of periods
    const periods = (days / 365) * periodsPerYear
    const periodRate = annualRate / periodsPerYear

    // Simple interest calculation: principal * rate * time
    return principal * periodRate * periods
  }

  // Calculate actual balance over time based on payment history and interest
  const calculateBalanceHistory = (debt: Debt) => {
    const balanceHistory: { date: Date; balance: number }[] = []
    let currentBalance = debt.principal
    const loanStartDate = new Date(debt.startDate)
    const interestStartDate = new Date(debt.interestStartDate)

    // Start with initial balance at loan start date
    balanceHistory.push({
      date: loanStartDate,
      balance: currentBalance,
    })

    // If interest starts later, add a point at interest start date
    if (interestStartDate.getTime() > loanStartDate.getTime()) {
      balanceHistory.push({
        date: interestStartDate,
        balance: currentBalance,
      })
    }

    // Sort payments by date
    const sortedPayments = [...debt.payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate balance after each payment
    sortedPayments.forEach((payment) => {
      const paymentDate = new Date(payment.date)
      
      // Only calculate interest if payment is after interest start date
      if (paymentDate >= interestStartDate && balanceHistory.length > 0) {
        const lastDate = balanceHistory[balanceHistory.length - 1].date
        const lastDateForInterest = lastDate < interestStartDate ? interestStartDate : lastDate
        const daysSinceLastPayment = (paymentDate.getTime() - lastDateForInterest.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceLastPayment > 0) {
          const interest = calculateInterest(
            currentBalance,
            debt.interestRate,
            debt.interestPeriod,
            daysSinceLastPayment
          )
          currentBalance += interest
        }
      }

      // Apply payment
      currentBalance = Math.max(0, currentBalance - payment.amount)

      balanceHistory.push({
        date: paymentDate,
        balance: parseFloat(currentBalance.toFixed(2)),
      })
    })

    // Add current date point if there are payments or if loan has started
    const today = new Date()
    if (today > loanStartDate) {
      const lastEntry = balanceHistory[balanceHistory.length - 1]
      if (lastEntry.date < today) {
        // Calculate interest from last entry to today
        if (today >= interestStartDate) {
          const lastDateForInterest = lastEntry.date < interestStartDate ? interestStartDate : lastEntry.date
          const daysSinceLastEntry = (today.getTime() - lastDateForInterest.getTime()) / (1000 * 60 * 60 * 24)
          
          if (daysSinceLastEntry > 0) {
            const interest = calculateInterest(
              lastEntry.balance,
              debt.interestRate,
              debt.interestPeriod,
              daysSinceLastEntry
            )
            const currentBalanceWithInterest = lastEntry.balance + interest
            balanceHistory.push({
              date: today,
              balance: parseFloat(currentBalanceWithInterest.toFixed(2)),
            })
          }
        }
      }
    }

    return balanceHistory
  }

  // Generate chart data from actual payment history
  // Shows all months after loan start date (no skipping) until 3 years, then switches to yearly
  // IMPORTANT: Recalculates interest for each point to ensure accurate balance
  const generateChartData = (debt: Debt) => {
    const balanceHistory = calculateBalanceHistory(debt)
    if (balanceHistory.length === 0) {
      return { labels: [], data: [] }
    }

    const startDate = new Date(debt.startDate)
    const today = new Date()
    const threeYearsFromStart = new Date(startDate)
    threeYearsFromStart.setFullYear(threeYearsFromStart.getFullYear() + 3)
    const interestStartDate = new Date(debt.interestStartDate)

    // Determine if we should use monthly or yearly intervals
    const useYearly = today > threeYearsFromStart

    const chartPoints: { date: Date; balance: number }[] = []
    
    // Helper function to calculate balance at a specific date
    const getBalanceAtDate = (targetDate: Date): number => {
      // Find the last balance history entry before or at this date
      const lastEntry = balanceHistory
        .filter(entry => entry.date <= targetDate)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
      
      if (!lastEntry) {
        return debt.principal
      }
      
      // If target date is after the last entry, calculate interest
      if (targetDate > lastEntry.date && targetDate >= interestStartDate) {
        const lastDateForInterest = lastEntry.date < interestStartDate ? interestStartDate : lastEntry.date
        const daysSinceLastEntry = (targetDate.getTime() - lastDateForInterest.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceLastEntry > 0) {
          const interest = calculateInterest(
            lastEntry.balance,
            debt.interestRate,
            debt.interestPeriod,
            daysSinceLastEntry
          )
          return parseFloat((lastEntry.balance + interest).toFixed(2))
        }
      }
      
      return lastEntry.balance
    }
    
    if (useYearly) {
      // Yearly intervals
      let currentDate = new Date(startDate)
      currentDate.setMonth(0, 1) // Start of year
      
      while (currentDate <= today) {
        const balance = getBalanceAtDate(currentDate)
        chartPoints.push({
          date: new Date(currentDate),
          balance: balance
        })
        
        currentDate = new Date(currentDate)
        currentDate.setFullYear(currentDate.getFullYear() + 1)
      }
      
      // Always include today if it's not already included
      if (chartPoints.length === 0 || chartPoints[chartPoints.length - 1].date < today) {
        const balance = getBalanceAtDate(today)
        chartPoints.push({
          date: today,
          balance: balance
        })
      }
    } else {
      // Monthly intervals - show ALL months without skipping
      let currentDate = new Date(startDate)
      currentDate.setDate(1) // Start of month
      
      while (currentDate <= today) {
        const balance = getBalanceAtDate(currentDate)
        chartPoints.push({
          date: new Date(currentDate),
          balance: balance
        })
        
        // Move to next month
        currentDate = new Date(currentDate)
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      // Always include today if it's not already included
      if (chartPoints.length === 0 || chartPoints[chartPoints.length - 1].date < today) {
        const balance = getBalanceAtDate(today)
        chartPoints.push({
          date: today,
          balance: balance
        })
      }
    }

    const labels = chartPoints.map((entry) => {
      if (useYearly) {
        return entry.date.toLocaleDateString('en-US', { year: 'numeric' })
      } else {
        return entry.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }
    })
    const data = chartPoints.map((entry) => entry.balance)

    return { labels, data }
  }

  // Chart data for selected debt
  const chartData = selectedDebt
    ? {
        labels: generateChartData(selectedDebt).labels,
        datasets: [
          {
            label: 'Remaining Balance',
            data: generateChartData(selectedDebt).data,
            borderColor: 'rgba(79, 70, 229, 1)', // Indigo 600
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 3,
            fill: true,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
        title: {
          display: true,
          text: 'Loan Balance Over Time',
          font: { size: 14, weight: 'bold' as const },
        },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Balance (USD)' },
        beginAtZero: true,
      },
      x: {
        title: { display: true, text: 'Date' },
      },
    },
  }

  const handleAddNew = () => {
    const tempId = `temp-${Date.now()}`
    const newDebt: Debt = {
      id: tempId,
      name: newDebtForm.name || 'New Debt',
      principal: newDebtForm.principal || 1000,
      interestRate: newDebtForm.interestRate || 5.0,
      interestPeriod: newDebtForm.interestPeriod || 'monthly',
      startDate: newDebtForm.startDate || new Date().toISOString().split('T')[0],
      interestStartDate: newDebtForm.interestStartDate || newDebtForm.startDate || new Date().toISOString().split('T')[0],
      payments: [],
    }
    setDebts([...debts, newDebt])
    setSelectedDebtId(tempId)
    setIsAddingNew(true)
  }

  const handleSaveNewDebt = async () => {
    if (!selectedDebt || !selectedDebt.id.startsWith('temp-')) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedDebt.name,
          principal: selectedDebt.principal,
          interestRate: selectedDebt.interestRate,
          interestPeriod: selectedDebt.interestPeriod,
          startDate: selectedDebt.startDate,
          interestStartDate: selectedDebt.interestStartDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create debt')
      }

      const newDebt = await response.json()
      setDebts(debts.map(d => d.id === selectedDebt.id ? newDebt : d))
      setSelectedDebtId(newDebt.id)
      setIsAddingNew(false)
      setNotification({ text: 'Debt created successfully!', type: 'success' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      console.error('Error creating debt:', error)
      setNotification({ text: error.message || 'Failed to create debt. Please try again.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    const id = deleteConfirmId

    // If it's a temp debt, just remove from state
    if (id.startsWith('temp-')) {
      const updated = debts.filter((d) => d.id !== id)
      setDebts(updated)
      if (selectedDebtId === id && updated.length > 0) {
        setSelectedDebtId(updated[0].id)
      } else if (updated.length === 0) {
        setSelectedDebtId('')
      }
      setDeleteConfirmId(null)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/debts?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete debt')
      }

    const updated = debts.filter((d) => d.id !== id)
    setDebts(updated)
    if (selectedDebtId === id && updated.length > 0) {
      setSelectedDebtId(updated[0].id)
    } else if (updated.length === 0) {
      setSelectedDebtId('')
    }

      setNotification({ text: 'Debt deleted successfully!', type: 'success' })
      setTimeout(() => setNotification(null), 3000)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting debt:', error)
      setNotification({ text: 'Failed to delete debt. Please try again.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  const handleUpdateDebt = async (id: string, field: keyof Debt, value: string | number) => {
    const updatedDebt = { ...selectedDebt!, [field]: value }
    setDebts(debts.map((d) => (d.id === id ? updatedDebt : d)))

    // If it's a temp debt, don't save to API yet
    if (id.startsWith('temp-')) {
      return
    }

    try {
      const response = await fetch('/api/debts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          [field]: value,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update debt')
      }

      const updated = await response.json()
      setDebts(debts.map((d) => (d.id === id ? updated : d)))
    } catch (error) {
      console.error('Error updating debt:', error)
      // Revert on error
      setDebts(debts.map((d) => (d.id === id ? selectedDebt! : d)))
      alert('Failed to update debt. Please try again.')
    }
  }

  const validateField = (value: string, field: 'principal' | 'interestRate'): { valid: boolean; error?: string; numValue?: number } => {
    const numValue = parseFloat(value)
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Must be a valid number' }
    }
    
    if (field === 'principal') {
      if (numValue <= 0) {
        return { valid: false, error: 'Principal must be greater than 0' }
      }
    } else if (field === 'interestRate') {
      if (numValue < 0) {
        return { valid: false, error: 'Interest rate must be greater than or equal to 0' }
      }
    }
    
    return { valid: true, numValue }
  }

  const validateDebt = (debt: Partial<Debt>): { valid: boolean; errors: Map<string, string> } => {
    const errors = new Map<string, string>()
    
    if (debt.principal !== undefined) {
      const validation = validateField(debt.principal.toString(), 'principal')
      if (!validation.valid && validation.error) {
        errors.set('principal', validation.error)
      }
    }
    
    if (debt.interestRate !== undefined) {
      const validation = validateField(debt.interestRate.toString(), 'interestRate')
      if (!validation.valid && validation.error) {
        errors.set('interestRate', validation.error)
      }
    }
    
    return { valid: errors.size === 0, errors }
  }

  const handleEditDetailsClick = () => {
    if (selectedDebt) {
      setIsEditing(true)
      setEditedDebt({
        name: selectedDebt.name,
        principal: selectedDebt.principal,
        interestRate: selectedDebt.interestRate,
        interestPeriod: selectedDebt.interestPeriod,
        startDate: selectedDebt.startDate,
        interestStartDate: selectedDebt.interestStartDate,
      })
      setFieldErrors(new Map())
    }
  }

  const handleUpdateDetails = async () => {
    if (!selectedDebt || !editedDebt) return

    const validation = validateDebt(editedDebt)
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      return
    }

    setIsSaving(true)
    setFieldErrors(new Map())
    
    try {
      const response = await fetch('/api/debts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDebt.id,
          ...editedDebt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update debt')
      }

      const updated = await response.json()
      setDebts(debts.map((d) => (d.id === selectedDebt.id ? updated : d)))
      
      setNotification({ text: 'Debt updated successfully!', type: 'success' })
      setTimeout(() => setNotification(null), 3000)
      
      setIsEditing(false)
      setEditedDebt(null)
    } catch (error: any) {
      console.error('Error updating debt:', error)
      setNotification({ text: error.message || 'Failed to update debt. Please try again.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedDebt(null)
    setFieldErrors(new Map())
  }

  const handleFieldChange = (field: keyof Debt, value: string | number) => {
    if (!editedDebt) return
    
    setEditedDebt({ ...editedDebt, [field]: value })
    
    // Clear error for this field when user starts typing
    if (field === 'principal' || field === 'interestRate') {
      const newErrors = new Map(fieldErrors)
      newErrors.delete(field)
      setFieldErrors(newErrors)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {notification.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Delete Debt</h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this debt? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Debt Tracking Dashboard</h1>

        {/* Two-Column Grid for Debt List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: List of Debt Items */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Debt/Loan Items</h2>
              <button
                onClick={handleAddNew}
                className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add New
              </button>
            </div>

            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
              {debts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  No debts. Click &quot;Add New&quot; to get started.
                </div>
              ) : (
                debts.map((debt) => (
                  <div
                    key={debt.id}
                    onClick={() => {
                      setSelectedDebtId(debt.id)
                      setIsAddingNew(false)
                    }}
                    className={`debt-item group cursor-pointer p-3 rounded-lg transition-all border-l-4 ${
                      selectedDebtId === debt.id
                        ? 'bg-indigo-50 border-indigo-600 font-semibold'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate flex-1">{debt.name}</span>
                      <span className="text-sm font-semibold ml-2 text-red-500">
                        {formatCurrency(debt.principal)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(debt.id)
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                        title="Delete"
                      >
                        <span className="text-lg font-bold">×</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Rate: {formatPercent(debt.interestRate)} ({debt.interestPeriod})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Visualization and Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {selectedDebt ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
                  {isAddingNew || (isEditing && editedDebt) ? (
                    <input
                      type="text"
                      value={isEditing && editedDebt ? (editedDebt.name || '') : selectedDebt.name}
                      onChange={(e) => {
                        if (isEditing && editedDebt) {
                          handleFieldChange('name', e.target.value)
                        } else {
                          handleUpdateDebt(selectedDebt.id, 'name', e.target.value)
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    selectedDebt.name
                  )}
                </h2>

                {/* Line Graph Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4" style={{ height: '40vh' }}>
                  {chartData && chartData.datasets?.[0]?.data?.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <p className="text-gray-400 text-center text-sm flex items-center justify-center h-full">
                      {selectedDebt.payments.length === 0
                        ? 'No payment history yet. Add payments to see balance over time.'
                        : 'Calculating balance history...'}
                    </p>
                  )}
                </div>

                {/* Principle, Interest, and Date Details */}
                <div className="p-4 bg-indigo-50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-indigo-600 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Loan Breakdown
                    </h3>
                    {!isAddingNew && !isEditing && (
                      <button
                        onClick={handleEditDetailsClick}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
                      >
                        Edit Details
                      </button>
                    )}
                    {isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateDetails}
                          disabled={isSaving}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-semibold"
                        >
                          {isSaving ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Current Principle */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Current Principal</p>
                      {isEditing && editedDebt ? (
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              value={editedDebt.principal || ''}
                              onChange={(e) => handleFieldChange('principal', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          {fieldErrors.has('principal') && (
                            <p className="text-red-600 text-xs mt-1">{fieldErrors.get('principal')}</p>
                          )}
                          </div>
                        ) : (
                        <span className="font-bold text-xl text-red-500">
                            {formatCurrency(selectedDebt.principal)}
                          </span>
                        )}
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">
                        Interest Rate (Annual)
                        {selectedDebt.interestPeriod && (
                          <span className="text-xs text-gray-400 ml-1">
                            - Compounded {selectedDebt.interestPeriod}
                          </span>
                        )}
                      </p>
                      {isEditing && editedDebt ? (
                        <div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editedDebt.interestRate || ''}
                              onChange={(e) => handleFieldChange('interestRate', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                          {fieldErrors.has('interestRate') && (
                            <p className="text-red-600 text-xs mt-1">{fieldErrors.get('interestRate')}</p>
                          )}
                          </div>
                        ) : (
                          <span
                            className={`font-bold text-xl ${
                              selectedDebt.interestRate >= 5.0 ? 'text-red-600' : 'text-gray-900'
                            }`}
                          >
                            {formatPercent(selectedDebt.interestRate)}
                          </span>
                        )}
                    </div>

                    {/* Interest Period */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Interest Period</p>
                      {isAddingNew || (isEditing && editedDebt) ? (
                        <select
                          value={isEditing && editedDebt ? (editedDebt.interestPeriod || 'monthly') : selectedDebt.interestPeriod}
                          onChange={(e) => {
                            if (isEditing && editedDebt) {
                              handleFieldChange('interestPeriod', e.target.value as 'daily' | 'monthly' | 'annually')
                            } else {
                              handleUpdateDebt(selectedDebt.id, 'interestPeriod', e.target.value as 'daily' | 'monthly' | 'annually')
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="monthly">Monthly</option>
                          <option value="annually">Annually</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-base text-gray-900 capitalize">
                          {selectedDebt.interestPeriod}
                        </span>
                      )}
                    </div>

                    {/* Loan Start Date */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Loan Start Date</p>
                      {isAddingNew || (isEditing && editedDebt) ? (
                        <input
                          type="date"
                          value={isEditing && editedDebt ? (editedDebt.startDate || '') : selectedDebt.startDate}
                          onChange={(e) => {
                            if (isEditing && editedDebt) {
                              handleFieldChange('startDate', e.target.value)
                              // Update interest start date if it's the same
                              if (editedDebt.interestStartDate === editedDebt.startDate) {
                                handleFieldChange('interestStartDate', e.target.value)
                              }
                            } else {
                              handleUpdateDebt(selectedDebt.id, 'startDate', e.target.value)
                              if (selectedDebt.interestStartDate === selectedDebt.startDate) {
                                handleUpdateDebt(selectedDebt.id, 'interestStartDate', e.target.value)
                              }
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base text-gray-900">
                          {formatDate(selectedDebt.startDate)}
                        </span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      )}
                    </div>

                    {/* Interest Start Date */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Interest Start Date</p>
                      {isAddingNew || (isEditing && editedDebt) ? (
                        <input
                          type="date"
                          value={isEditing && editedDebt ? (editedDebt.interestStartDate || '') : selectedDebt.interestStartDate}
                          onChange={(e) => {
                            if (isEditing && editedDebt) {
                              handleFieldChange('interestStartDate', e.target.value)
                            } else {
                              handleUpdateDebt(selectedDebt.id, 'interestStartDate', e.target.value)
                            }
                          }}
                          min={isEditing && editedDebt ? (editedDebt.startDate || '') : selectedDebt.startDate}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-base text-gray-900">
                            {formatDate(selectedDebt.interestStartDate)}
                          </span>
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {isAddingNew && (
                    <div className="pt-4 border-t border-indigo-200">
                      <button
                        onClick={handleSaveNewDebt}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Debt'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Select a Debt to View Details</p>
                <p className="text-sm mt-2">Or click &quot;Add New&quot; to create a new debt entry</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .debt-item {
          transition: background-color 0.15s, border-color 0.15s;
        }
      `}</style>
    </main>
  )
}
