'use client'

import { useState } from 'react'
import { Plus, Pencil, Calendar, Calculator } from 'lucide-react'
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
  startDate: string
  payments: Payment[] // Actual payment history
}

// Mock data - student debts with payment history
const MOCK_DEBTS: Debt[] = [
  {
    id: '1',
    name: 'Federal Student Loan',
    principal: 18500,
    interestRate: 5.5,
    startDate: '2023-09-01',
    payments: [
      { date: '2023-10-01', amount: 150 },
      { date: '2023-11-01', amount: 150 },
      { date: '2023-12-01', amount: 150 },
      { date: '2024-01-01', amount: 150 },
      { date: '2024-02-01', amount: 150 },
      { date: '2024-03-01', amount: 150 },
      { date: '2024-04-01', amount: 150 },
      { date: '2024-05-01', amount: 150 },
      { date: '2024-06-01', amount: 150 },
      { date: '2024-07-01', amount: 150 },
      { date: '2024-08-01', amount: 150 },
      { date: '2024-09-01', amount: 150 },
      { date: '2024-10-01', amount: 150 },
      { date: '2024-11-01', amount: 150 },
      { date: '2024-12-01', amount: 150 },
      { date: '2025-01-01', amount: 150 },
    ],
  },
  {
    id: '2',
    name: 'Private Student Loan',
    principal: 8500,
    interestRate: 7.25,
    startDate: '2024-01-15',
    payments: [
      { date: '2024-02-15', amount: 100 },
      { date: '2024-03-15', amount: 100 },
      { date: '2024-04-15', amount: 100 },
      { date: '2024-05-15', amount: 100 },
      { date: '2024-06-15', amount: 100 },
      { date: '2024-07-15', amount: 100 },
      { date: '2024-08-15', amount: 100 },
      { date: '2024-09-15', amount: 100 },
      { date: '2024-10-15', amount: 100 },
      { date: '2024-11-15', amount: 100 },
      { date: '2024-12-15', amount: 100 },
      { date: '2025-01-15', amount: 100 },
    ],
  },
  {
    id: '3',
    name: 'Student Credit Card',
    principal: 450,
    interestRate: 18.99,
    startDate: '2024-06-01',
    payments: [
      { date: '2024-07-01', amount: 50 },
      { date: '2024-08-01', amount: 50 },
      { date: '2024-09-01', amount: 50 },
      { date: '2024-10-01', amount: 50 },
      { date: '2024-11-01', amount: 50 },
      { date: '2024-12-01', amount: 50 },
      { date: '2025-01-01', amount: 50 },
    ],
  },
  {
    id: '4',
    name: 'Textbook Payment Plan',
    principal: 320,
    interestRate: 0.0,
    startDate: '2024-09-01',
    payments: [
      { date: '2024-10-01', amount: 80 },
      { date: '2024-11-01', amount: 80 },
      { date: '2024-12-01', amount: 80 },
      { date: '2025-01-01', amount: 80 },
    ],
  },
]

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>(MOCK_DEBTS)
  const [selectedDebtId, setSelectedDebtId] = useState<string>(MOCK_DEBTS[0]?.id || '')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingField, setEditingField] = useState<'principal' | 'interestRate' | null>(null)
  const [editValue, setEditValue] = useState('')

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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  // Calculate actual balance over time based on payment history
  const calculateBalanceHistory = (debt: Debt) => {
    const balanceHistory: { date: Date; balance: number }[] = []
    let currentBalance = debt.principal

    // Start with initial balance
    balanceHistory.push({
      date: new Date(debt.startDate),
      balance: currentBalance,
    })

    // Sort payments by date
    const sortedPayments = [...debt.payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate balance after each payment
    sortedPayments.forEach((payment) => {
      const paymentDate = new Date(payment.date)
      
      // Calculate interest accrued since last payment
      if (balanceHistory.length > 0) {
        const lastDate = balanceHistory[balanceHistory.length - 1].date
        const daysSinceLastPayment = (paymentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        const monthlyInterest = (debt.interestRate / 100) / 365 * daysSinceLastPayment * currentBalance
        currentBalance += monthlyInterest
      }

      // Apply payment
      currentBalance = Math.max(0, currentBalance - payment.amount)

      balanceHistory.push({
        date: paymentDate,
        balance: parseFloat(currentBalance.toFixed(2)),
      })
    })

    return balanceHistory
  }

  // Generate chart data from actual payment history
  const generateChartData = (debt: Debt) => {
    const balanceHistory = calculateBalanceHistory(debt)
    
    const labels = balanceHistory.map((entry) =>
      entry.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    )
    const data = balanceHistory.map((entry) => entry.balance)

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
      },
      x: {
        title: { display: true, text: 'Payment Dates' },
      },
    },
  }

  const handleAddNew = () => {
    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      name: 'New Debt',
      principal: 1000,
      interestRate: 5.0,
      startDate: new Date().toISOString().split('T')[0],
      payments: [],
    }
    setDebts([...debts, newDebt])
    setSelectedDebtId(newDebt.id)
    setIsAddingNew(true)
  }

  const handleDelete = (id: string) => {
    const updated = debts.filter((d) => d.id !== id)
    setDebts(updated)
    if (selectedDebtId === id && updated.length > 0) {
      setSelectedDebtId(updated[0].id)
    } else if (updated.length === 0) {
      setSelectedDebtId('')
    }
  }

  const handleUpdateDebt = (id: string, field: keyof Debt, value: string | number) => {
    setDebts(debts.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  const handleStartEdit = (field: 'principal' | 'interestRate') => {
    if (selectedDebt) {
      setEditingField(field)
      setEditValue(field === 'principal' ? selectedDebt.principal.toString() : selectedDebt.interestRate.toString())
    }
  }

  const handleSaveEdit = () => {
    if (selectedDebt && editingField) {
      const numValue = parseFloat(editValue) || 0
      handleUpdateDebt(selectedDebt.id, editingField, numValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
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
                  No debts. Click "Add New" to get started.
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
                      <span
                        className={`text-sm font-semibold ml-2 ${
                          debt.interestRate > 5 ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        {formatCurrency(debt.principal)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete "${debt.name}"?`)) {
                            handleDelete(debt.id)
                          }
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                        title="Delete"
                      >
                        <span className="text-lg font-bold">×</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Rate: {formatPercent(debt.interestRate)}
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
                  {isAddingNew ? (
                    <input
                      type="text"
                      value={selectedDebt.name}
                      onChange={(e) => handleUpdateDebt(selectedDebt.id, 'name', e.target.value)}
                      onBlur={() => setIsAddingNew(false)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    selectedDebt.name
                  )}
                </h2>

                {/* Line Graph Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4" style={{ height: '40vh' }}>
                  {chartData ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <p className="text-gray-400 text-center text-sm flex items-center justify-center h-full">
                      {selectedDebt.payments.length === 0
                        ? 'No payment history yet. Add payments to see balance over time.'
                        : 'Line Graph showing the selected item\'s balance over time'}
                    </p>
                  )}
                </div>

                {/* Principle, Interest, and Date Details */}
                <div className="p-4 bg-indigo-50 rounded-xl space-y-4">
                  <h3 className="text-lg font-bold text-indigo-600 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Loan Breakdown
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Current Principle */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Current Principle</p>
                      <div className="flex items-center justify-between">
                        {editingField === 'principal' ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                              onBlur={handleSaveEdit}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-xl text-gray-900">
                            {formatCurrency(selectedDebt.principal)}
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit('principal')}
                          className="ml-2 text-gray-400 hover:text-indigo-600"
                          title="Edit Principle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Annual Interest Rate</p>
                      <div className="flex items-center justify-between">
                        {editingField === 'interestRate' ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                              onBlur={handleSaveEdit}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                            <span className="text-gray-500">%</span>
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
                        <button
                          onClick={() => handleStartEdit('interestRate')}
                          className="ml-2 text-gray-400 hover:text-indigo-600"
                          title="Edit Interest"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Starting Date */}
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Loan Start Date</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base text-gray-900">
                          {formatDate(selectedDebt.startDate)}
                        </span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
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

