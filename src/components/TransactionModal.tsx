'use client'

import { useState, useEffect } from 'react'
import { X, Plus, ChevronRight, Trash2 } from 'lucide-react'
import { getCategories, addCategory } from '@/lib/categories'

interface Transaction {
  id: number
  type: 'Expense' | 'Income'
  amount: number
  category: string
  date: string
  account: string
  notes: string
}

interface StatementItem {
  id: number
  description: string
  amount: number
  date: string
  originalNotes: string
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveTransaction: () => void // Callback to update untracked count
  untrackedCount: number // Number of untracked statements
  onDeleteStatement: () => void // Callback when statement is deleted
}

// Mock statement templates - student transactions
const STATEMENT_TEMPLATES: StatementItem[] = [
  { id: 101, description: 'Amazon.com AMZN', amount: -89.99, date: '2024-04-22', originalNotes: 'Textbook purchase' },
  { id: 102, description: 'Starbucks #1234', amount: -5.50, date: '2024-04-22', originalNotes: 'Coffee before class' },
  { id: 103, description: 'Campus Bookstore', amount: -125.00, date: '2024-04-21', originalNotes: 'Chemistry textbook' },
  { id: 104, description: 'Deposit - Part-time Job', amount: 320.0, date: '2024-04-15', originalNotes: 'Weekly paycheck' },
  { id: 105, description: 'Walmart Supercenter', amount: -42.30, date: '2024-04-20', originalNotes: 'Groceries for week' },
  { id: 106, description: 'Uber Ride', amount: -12.50, date: '2024-04-19', originalNotes: 'Ride to campus' },
]

export default function TransactionModal({
  isOpen,
  onClose,
  onSaveTransaction,
  untrackedCount,
  onDeleteStatement,
}: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'edit' | 'statements'>('new')
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null)
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null)
  const [hasLinkedAccounts, setHasLinkedAccounts] = useState(true) // Mock: assume accounts are linked
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  
  // Load categories and listen for updates
  useEffect(() => {
    const loadCategories = () => {
      setCategories(getCategories())
    }
    
    loadCategories()
    
    // Listen for category updates from other components (e.g., Goals page)
    window.addEventListener('categories-updated', loadCategories)
    
    return () => {
      window.removeEventListener('categories-updated', loadCategories)
    }
  }, [])
  const [accounts, setAccounts] = useState(['Checking', 'Savings', 'Credit Card'])

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Expense' as 'Expense' | 'Income',
    category: '',
    date: new Date().toISOString().split('T')[0],
    account: '',
    notes: '',
  })

  // Mock data - student transactions
  const [transactions] = useState<Transaction[]>([
    { id: 1, type: 'Expense', amount: -32.50, category: 'Groceries', date: '2024-04-20', account: 'Checking', notes: 'Weekly groceries at Walmart' },
    { id: 2, type: 'Income', amount: 320.0, category: 'Part-time Job (Income)', date: '2024-04-15', account: 'Checking', notes: 'Part-time job paycheck' },
    { id: 3, type: 'Expense', amount: -4.99, category: 'Streaming', date: '2024-04-10', account: 'Credit Card', notes: 'Spotify Student Premium' },
    { id: 4, type: 'Expense', amount: -18.75, category: 'Food/Dining', date: '2024-04-08', account: 'Credit Card', notes: 'Campus dining with friends' },
    { id: 5, type: 'Expense', amount: -5.50, category: 'Coffee', date: '2024-04-07', account: 'Checking', notes: 'Starbucks before class' },
  ])

  const [statementItems, setStatementItems] = useState<StatementItem[]>(() =>
    STATEMENT_TEMPLATES.slice(0, untrackedCount)
  )

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('new')
      setSelectedEditId(null)
      setSelectedStatementId(null)
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    // Update statement items when untracked count changes
    const newItems = STATEMENT_TEMPLATES.slice(0, untrackedCount)
    setStatementItems(newItems)
    // Clear selection if current selection is beyond available items
    if (selectedStatementId && !newItems.find((item) => item.id === selectedStatementId)) {
      setSelectedStatementId(null)
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [untrackedCount])

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'Expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
      notes: '',
    })
    setIsAddingCategory(false)
    setNewCategoryName('')
    setIsAddingAccount(false)
    setNewAccountName('')
  }

  const handleTabChange = (tab: 'new' | 'edit' | 'statements') => {
    setActiveTab(tab)
    setSelectedEditId(null)
    setSelectedStatementId(null)
    resetForm() // Reset form when switching tabs
  }

  const handleSelectEdit = (transaction: Transaction) => {
    setSelectedEditId(transaction.id)
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.amount < 0 ? 'Expense' : 'Income',
      category: transaction.category,
      date: transaction.date,
      account: transaction.account,
      notes: transaction.notes,
    })
  }

  const handleSelectStatement = (statement: StatementItem) => {
    setSelectedStatementId(statement.id)
    setFormData({
      amount: Math.abs(statement.amount).toString(),
      type: statement.amount < 0 ? 'Expense' : 'Income',
      category: '',
      date: statement.date,
      account: '',
      notes: statement.originalNotes,
    })
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      addCategory(newCategoryName.trim())
      setCategories([...categories, newCategoryName.trim()])
      setFormData({ ...formData, category: newCategoryName.trim() })
      setIsAddingCategory(false)
      setNewCategoryName('')
    }
  }

  const handleAddAccount = () => {
    if (newAccountName.trim() && !accounts.includes(newAccountName.trim())) {
      setAccounts([...accounts, newAccountName.trim()])
      setFormData({ ...formData, account: newAccountName.trim() })
      setIsAddingAccount(false)
      setNewAccountName('')
    }
  }

  const handleDeleteStatement = (id: number) => {
    setStatementItems(statementItems.filter((item) => item.id !== id))
    if (selectedStatementId === id) {
      setSelectedStatementId(null)
      resetForm()
    }
    onDeleteStatement() // Decrease the untracked count
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Save transaction logic here
    console.log('Saving transaction:', formData)
    
    // If saving from statements tab, decrease untracked count
    if (activeTab === 'statements' && selectedStatementId) {
      onSaveTransaction()
    }
    
    // Reset form
    setFormData({
      amount: '',
      type: 'Expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
      notes: '',
    })
    setSelectedEditId(null)
    setSelectedStatementId(null)
    
    // Close modal if on new tab, otherwise stay open
    if (activeTab === 'new') {
      onClose()
    }
  }

  if (!isOpen) return null

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">Transaction Manager</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 px-6 pt-6 border-b pb-4">
          <button
            onClick={() => handleTabChange('new')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            New
          </button>
          <button
            onClick={() => handleTabChange('edit')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => handleTabChange('statements')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'statements'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            From Statements
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* New Tab */}
          {activeTab === 'new' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                $ Amount <span className="text-gray-500 text-base font-normal"></span>
              </h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="flex-1 text-2xl font-bold text-center py-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'Expense' })}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          formData.type === 'Expense'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'Income' })}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          formData.type === 'Income'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCategory()
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setIsAddingCategory(true)
                          } else {
                            setFormData({ ...formData, category: e.target.value })
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                        required={!isAddingCategory}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__add_new__" className="text-indigo-600 font-semibold">
                          + Add new Category
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account (Optional)</label>
                    {isAddingAccount ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          placeholder="Account name"
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddAccount()
                            }
                            if (e.key === 'Escape') {
                              setIsAddingAccount(false)
                              setNewAccountName('')
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddAccount}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingAccount(false)
                            setNewAccountName('')
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={formData.account}
                          onChange={(e) => {
                            if (e.target.value === '__add_new__') {
                              setIsAddingAccount(true)
                            } else {
                              setFormData({ ...formData, account: e.target.value })
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                        >
                          <option value="">Select Account (Optional)</option>
                          {accounts.map((acc) => (
                            <option key={acc} value={acc}>
                              {acc}
                            </option>
                          ))}
                          <option value="__add_new__" className="text-indigo-600 font-semibold">
                            + Add new Account
                          </option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Add a description or tags"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition"
                >
                  Save Transaction
                </button>
              </form>
            </div>
          )}

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div className={isDesktop ? 'grid grid-cols-3 gap-6' : 'space-y-6'}>
              {/* Transaction List */}
              <div className={isDesktop ? 'col-span-1' : ''}>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Past Transactions</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleSelectEdit(transaction)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedEditId === transaction.id
                          ? 'bg-indigo-50 border-indigo-500 border-l-4'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-lg">
                        {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.category} on {transaction.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className={isDesktop ? 'col-span-2' : selectedEditId ? '' : 'hidden'}>
                {!selectedEditId && !isDesktop && (
                  <p className="text-center text-gray-500 mt-8">Select a transaction from the list to edit.</p>
                )}
                {selectedEditId && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      $ Amount <span className="text-gray-500 text-base font-normal">Expense or Income</span>
                    </h2>
                    <form onSubmit={handleSave} className="space-y-6">
                      {/* Same form fields as New tab */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            className="flex-1 text-2xl font-bold text-center py-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            required
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, type: 'Expense' })}
                              className={`px-4 py-2 rounded-lg font-semibold transition ${
                                formData.type === 'Expense'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Expense
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, type: 'Income' })}
                              className={`px-4 py-2 rounded-lg font-semibold transition ${
                                formData.type === 'Income'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Income
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        {isAddingCategory ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Category name"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddCategory()
                                }
                                if (e.key === 'Escape') {
                                  setIsAddingCategory(false)
                                  setNewCategoryName('')
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCategory(false)
                                setNewCategoryName('')
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={formData.category}
                              onChange={(e) => {
                                if (e.target.value === '__add_new__') {
                                  setIsAddingCategory(true)
                                } else {
                                  setFormData({ ...formData, category: e.target.value })
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                              required={!isAddingCategory}
                            >
                              <option value="">Select Category</option>
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              <option value="__add_new__" className="text-indigo-600 font-semibold">
                                + Add new Category
                              </option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account (Optional)</label>
                          {isAddingAccount ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                placeholder="Account name"
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddAccount()
                                  }
                                  if (e.key === 'Escape') {
                                    setIsAddingAccount(false)
                                    setNewAccountName('')
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleAddAccount}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingAccount(false)
                                  setNewAccountName('')
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                value={formData.account}
                                onChange={(e) => {
                                  if (e.target.value === '__add_new__') {
                                    setIsAddingAccount(true)
                                  } else {
                                    setFormData({ ...formData, account: e.target.value })
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                              >
                                <option value="">Select Account (Optional)</option>
                                {accounts.map((acc) => (
                                  <option key={acc} value={acc}>
                                    {acc}
                                  </option>
                                ))}
                                <option value="__add_new__" className="text-indigo-600 font-semibold">
                                  + Add new Account
                                </option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={3}
                          placeholder="Add a description or tags"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition"
                      >
                        Update Transaction
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Statements Tab */}
          {activeTab === 'statements' && (
            <div>
              {!hasLinkedAccounts ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-6">No accounts linked yet.</p>
                  <a
                    href="/#accounts"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Link an Account
                  </a>
                </div>
              ) : (
                <div className={isDesktop ? 'grid grid-cols-3 gap-6' : 'space-y-6'}>
                  {/* Statement List */}
                  <div className={isDesktop ? 'col-span-1' : ''}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Statement Items</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {statementItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-lg transition ${
                            selectedStatementId === item.id
                              ? 'bg-indigo-50 border-indigo-500 border-l-4'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              onClick={() => handleSelectStatement(item)}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-semibold text-lg">
                                {item.amount < 0 ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">{item.description}</div>
                              <div className="text-xs text-gray-400 mt-1">{item.date}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStatement(item.id)
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete statement"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form */}
                  <div className={isDesktop ? 'col-span-2' : selectedStatementId ? '' : 'hidden'}>
                    {!selectedStatementId && !isDesktop && (
                      <p className="text-center text-gray-500 mt-8">Select a statement item from the list to process.</p>
                    )}
                    {selectedStatementId && (
                      <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                          $ Amount <span className="text-gray-500 text-base font-normal">Expense or Income</span>
                        </h2>
                        <form onSubmit={handleSave} className="space-y-6">
                          {/* Same form fields as New tab */}
                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="flex-1 text-2xl font-bold text-center py-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                required
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, type: 'Expense' })}
                                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                                    formData.type === 'Expense'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  Expense
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, type: 'Income' })}
                                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                                    formData.type === 'Income'
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  Income
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            {isAddingCategory ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="Category name"
                                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleAddCategory()
                                    }
                                    if (e.key === 'Escape') {
                                      setIsAddingCategory(false)
                                      setNewCategoryName('')
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingCategory(false)
                                    setNewCategoryName('')
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={formData.category}
                                  onChange={(e) => {
                                    if (e.target.value === '__add_new__') {
                                      setIsAddingCategory(true)
                                    } else {
                                      setFormData({ ...formData, category: e.target.value })
                                    }
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                                  required={!isAddingCategory}
                                >
                                  <option value="">Select Category</option>
                                  {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                  <option value="__add_new__" className="text-indigo-600 font-semibold">
                                    + Add new Category
                                  </option>
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-group">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                              <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Account (Optional)</label>
                              {isAddingAccount ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    placeholder="Account name"
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddAccount()
                                      }
                                      if (e.key === 'Escape') {
                                        setIsAddingAccount(false)
                                        setNewAccountName('')
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddAccount}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingAccount(false)
                                      setNewAccountName('')
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <select
                                    value={formData.account}
                                    onChange={(e) => {
                                      if (e.target.value === '__add_new__') {
                                        setIsAddingAccount(true)
                                      } else {
                                        setFormData({ ...formData, account: e.target.value })
                                      }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none bg-white"
                                  >
                                    <option value="">Select Account (Optional)</option>
                                    {accounts.map((acc) => (
                                      <option key={acc} value={acc}>
                                        {acc}
                                      </option>
                                    ))}
                                    <option value="__add_new__" className="text-indigo-600 font-semibold">
                                      + Add new Account
                                    </option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={3}
                              placeholder="Notes from statement"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition"
                          >
                            Import Transaction
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

