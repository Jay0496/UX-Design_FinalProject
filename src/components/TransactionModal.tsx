'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Plus, ChevronRight, Trash2, Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  category: string | null
  category_id: string | null
  date: string
  account: string | null
  notes: string | null
  debt_id: string | null
}

interface Category {
  id: string
  name: string
  category_type: 'income' | 'expense'
}

interface Debt {
  id: string
  name: string
  principal: number
  start_date: string
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

// No hard-coded statements - will be populated from connected accounts
const STATEMENT_TEMPLATES: StatementItem[] = []

export default function TransactionModal({
  isOpen,
  onClose,
  onSaveTransaction,
  untrackedCount,
  onDeleteStatement,
}: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'edit' | 'statements'>('new')
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null)
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null)
  const [hasLinkedAccounts, setHasLinkedAccounts] = useState(true) // Mock: assume accounts are linked
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [debts, setDebts] = useState<Debt[]>([])
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [debtError, setDebtError] = useState<string | null>(null)
  const [selectedDebtName, setSelectedDebtName] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  
  const [accounts, setAccounts] = useState(['Checking', 'Savings', 'Credit Card'])

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Expense' as 'Expense' | 'Income',
    category: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    account: '',
    notes: '',
    debt_id: null as string | null,
  })

  const [statementItems, setStatementItems] = useState<StatementItem[]>([])

  // Helper function to convert string to title case
  const toTitleCase = (str: string): string => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Define fetch functions first
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setNotification({ text: 'Failed to load transactions', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts')
      if (response.ok) {
        const data = await response.json()
        setDebts(data)
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
    }
  }

  // Load categories from API FIRST - before anything else
  // This fetches ALL categories for the user (SELECT * FROM categories WHERE user_id = auth_id)
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories') // No type filter - gets all categories
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        setCategoriesLoaded(true)
        // Map will automatically rebuild via useMemo when categories change
      } else {
        console.error('Failed to load categories, response not ok:', response.status)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  useEffect(() => {
    loadCategories()
    
    // Listen for category updates from other components
    window.addEventListener('categories-updated', loadCategories)
    
    return () => {
      window.removeEventListener('categories-updated', loadCategories)
    }
  }, [])

  // Load transactions when edit tab is active AND categories are loaded
  useEffect(() => {
    if (activeTab === 'edit' && isOpen && categoriesLoaded) {
      fetchTransactions()
    }
  }, [activeTab, isOpen, categoriesLoaded])

  // Load debts when showing debt modal
  useEffect(() => {
    if (showDebtModal) {
      fetchDebts()
    }
  }, [showDebtModal])

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('new')
      setSelectedEditId(null)
      setSelectedStatementId(null)
      resetForm()
    }
  }, [isOpen])

  // Create a map of category_id to category name for quick lookups
  // This map is built from ALL categories fetched from the API (SELECT * FROM categories WHERE user_id = auth_id)
  // The map automatically rebuilds whenever categories change (via useMemo dependency)
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(cat => {
      map.set(cat.id, cat.name)
    })
    return map
  }, [categories])

  // Helper function to get category name from category_id using the map
  // This is used throughout the component to display category names instead of "No category" or "Select Category"
  const getCategoryName = (categoryId: string | null | undefined): string => {
    if (!categoryId) {
      return ''
    }
    // First try the map (fastest lookup)
    const nameFromMap = categoryMap.get(categoryId)
    if (nameFromMap) {
      return nameFromMap
    }
    // Fallback: find in categories array
    const found = categories.find(c => c.id === categoryId)
    if (found) {
      return found.name
    }
    return ''
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'Expense',
      category: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
      notes: '',
      debt_id: null,
    })
    setIsAddingCategory(false)
    setNewCategoryName('')
    setIsAddingAccount(false)
    setNewAccountName('')
    setSelectedDebtId(null)
    setDebtError(null)
    setSelectedDebtName(null)
  }

  const handleTabChange = (tab: 'new' | 'edit' | 'statements') => {
    setActiveTab(tab)
    setSelectedEditId(null)
    setSelectedStatementId(null)
    setIsAddingCategory(false) // Reset category input state
    setNewCategoryName('')
    resetForm() // Reset form when switching tabs
  }

  const handleSelectEdit = async (transaction: Transaction) => {
    setSelectedEditId(transaction.id)
    
    // Reset category input state
    setIsAddingCategory(false)
    setNewCategoryName('')
    
    // If transaction has a debt_id, fetch the debt name
    if (transaction.debt_id) {
      try {
        const response = await fetch('/api/debts')
        if (response.ok) {
          const debtsData = await response.json()
          const debt = debtsData.find((d: Debt) => d.id === transaction.debt_id)
          if (debt) {
            setSelectedDebtName(debt.name)
          }
        }
      } catch (error) {
        console.error('Error fetching debt:', error)
      }
    } else {
      setSelectedDebtName(null)
    }
    
    // Determine transaction type
    const transactionType = transaction.amount < 0 ? 'Expense' : 'Income'
    
    // PRIORITY: Use category_id from database to find category name
    const categoryId = transaction.category_id || ''
    let categoryName = ''
    
    // Method 1: Use category_id with the category map (fastest)
    if (categoryId) {
      categoryName = getCategoryName(categoryId)
    }
    
    // Method 2: Fallback to transaction.category (from API join)
    if (!categoryName && transaction.category) {
      categoryName = transaction.category
      // If we have the name but not the ID, try to find the ID
      if (!categoryId && categories.length > 0) {
        const foundCategory = categories.find(
          c => c.name.toLowerCase() === categoryName.toLowerCase()
        )
        if (foundCategory) {
          // Update formData with the found ID
          setFormData(prev => ({
            ...prev,
            category_id: foundCategory.id
          }))
        }
      }
    }
    
    // Set form data - use the category_id directly from database
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      type: transactionType,
      category: categoryName,
      category_id: categoryId, // Use category_id from database - this is what select uses
      date: transaction.date,
      account: transaction.account || '',
      notes: transaction.notes || '',
      debt_id: transaction.debt_id || null,
    })
  }

  const handleSelectStatement = (statement: StatementItem) => {
    setSelectedStatementId(statement.id)
    setFormData({
      amount: Math.abs(statement.amount).toString(),
      type: statement.amount < 0 ? 'Expense' : 'Income',
      category: '',
      category_id: '',
      date: statement.date,
      account: '',
      notes: statement.originalNotes,
      debt_id: null,
    })
  }

  // Handle category selection from dropdown (like Goals page)
  const handleCategorySelect = (value: string) => {
    if (value === '__add_new__') {
      // Show input for adding new category
      setIsAddingCategory(true)
      setNewCategoryName('')
    } else {
      // Category selected from dropdown
      const selectedCategory = categories.find(c => c.id === value)
      if (selectedCategory) {
        setFormData({ 
          ...formData, 
          category: selectedCategory.name,
          category_id: selectedCategory.id 
        })
        setIsAddingCategory(false) // Hide add category input if it was showing
      }
    }
  }

  // Handle typing in new category input (like Goals page)
  const handleNewCategoryInput = (categoryName: string) => {
    // Update formData with the category name as user types
    setFormData({ 
      ...formData, 
      category: categoryName,
      category_id: '' // Clear category_id when typing new category
    })
    setNewCategoryName(categoryName)
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

  const handleDeleteClick = (transactionId: string) => {
    setDeleteConfirmId(transactionId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/transactions?id=${deleteConfirmId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete transaction'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch (textError) {
            errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`
          }
        }
        throw new Error(errorMessage)
      }

      setNotification({ text: 'Transaction deleted successfully!', type: 'success' })
      setTimeout(() => setNotification(null), 3000)

      // Refresh transactions
      await fetchTransactions()

      // If deleted transaction was selected, clear selection
      if (selectedEditId === deleteConfirmId) {
        setSelectedEditId(null)
        resetForm()
      }

      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      setNotification({ text: error.message || 'Failed to delete transaction', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  const handleDebtSelect = async () => {
    if (!selectedDebtId) {
      setDebtError('Please select a loan')
      return
    }

    // Find the debt name
    const selectedDebt = debts.find(d => d.id === selectedDebtId)
    if (selectedDebt) {
      setSelectedDebtName(selectedDebt.name)
    }

    setDebtError(null)
    setFormData({ ...formData, debt_id: selectedDebtId })
    setShowDebtModal(false)
    
    // Continue with save
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    await handleSave(fakeEvent)
  }

  // Find or create category (similar to Goals page)
  const findOrCreateCategory = async (categoryName: string): Promise<Category | null> => {
    if (!categoryName || !categoryName.trim()) {
      return null
    }

    const trimmedName = categoryName.trim()
    const titleCaseName = toTitleCase(trimmedName)

    // First, check if category exists in local state (case-insensitive)
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === titleCaseName.toLowerCase()
    )
    if (existingCategory) {
      return existingCategory
    }

    // Category doesn't exist, create it with title case
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: titleCaseName,
          category_type: formData.type.toLowerCase() as 'income' | 'expense'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }

      const newCategory = await response.json()
      
      // Update local categories list
      const updatedCategories = [...categories, newCategory]
      setCategories(updatedCategories)
      
      // Dispatch event for other components
      window.dispatchEvent(new Event('categories-updated'))
      
      return newCategory
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setNotification({ text: 'Please enter a valid amount', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    // Validate category - must have either category_id or category name
    const categoryName = formData.category_id 
      ? categories.find(c => c.id === formData.category_id)?.name || formData.category
      : formData.category

    if (!categoryName || !categoryName.trim()) {
      setNotification({ text: 'Please enter a category', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setIsSaving(true)
    try {
      // Find or create the category automatically
      let categoryId = formData.category_id
      if (!categoryId) {
        const category = await findOrCreateCategory(categoryName)
        if (!category) {
          setNotification({ text: 'Failed to create category', type: 'error' })
          setTimeout(() => setNotification(null), 3000)
          setIsSaving(false)
          return
        }
        categoryId = category.id
      } else {
        // Verify the category still exists (case-insensitive check)
        const existingCategory = categories.find(
          c => c.id === categoryId || c.name.toLowerCase() === categoryName.toLowerCase()
        )
        if (existingCategory && existingCategory.id !== categoryId) {
          // Category name matches but ID is different - use the existing category
          categoryId = existingCategory.id
        }
      }

      // If it's a loan payment (expense), show debt selection modal
      if (formData.type === 'Expense' && !formData.debt_id && !selectedEditId) {
        const finalCategoryName = categories.find(c => c.id === categoryId)?.name || categoryName
        const isLoanPayment = finalCategoryName.toLowerCase().includes('loan') || 
                             finalCategoryName.toLowerCase().includes('payment')
        
        if (isLoanPayment) {
          setShowDebtModal(true)
          setIsSaving(false)
          return // Don't save yet, wait for debt selection
        }
      }

      const payload: any = {
        type: formData.type.toLowerCase(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        category_id: categoryId,
        account: formData.account || null,
        notes: formData.notes || null,
      }

      if (formData.debt_id) {
        payload.debt_id = formData.debt_id
      }

      let response
      if (selectedEditId && activeTab === 'edit') {
        // Update existing transaction
        response = await fetch('/api/transactions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedEditId, ...payload }),
        })
      } else {
        // Create new transaction
        response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        let errorMessage = 'Failed to save transaction'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch (textError) {
            // If we can't get text either, use status-based message
            errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`
          }
        }
        throw new Error(errorMessage)
      }

      // Show success notification
      setNotification({ 
        text: selectedEditId ? 'Transaction updated successfully!' : 'Transaction saved successfully!', 
        type: 'success' 
      })

      // Refresh transactions if on edit tab
      if (activeTab === 'edit') {
        await fetchTransactions()
      }

      // If saving from statements tab, decrease untracked count
      if (activeTab === 'statements' && selectedStatementId) {
        onSaveTransaction()
      }
      
      // Reset form
      resetForm()
      setSelectedEditId(null)
      setSelectedStatementId(null)
      
      // Close modal if on new tab, otherwise stay open
      // Keep modal open for 1 second so notification is visible before closing
      if (activeTab === 'new') {
        setTimeout(() => {
          setNotification(null)
          onClose()
        }, 1000)
      } else {
        // For edit tab, show notification for 4 seconds
        setTimeout(() => setNotification(null), 4000)
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error)
      setNotification({ text: error.message || 'Failed to save transaction', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Early return check - must be after all hooks
  if (!isOpen) return null

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  // Get filtered categories based on transaction type
  // Always include the currently selected category even if it doesn't match the type filter
  const filteredCategories = categories.filter(
    cat => cat.category_type === (formData.type === 'Expense' ? 'expense' : 'income')
  )
  
  // If we have a category_id set but it's not in the filtered list, add it
  const getCategoriesForSelect = () => {
    const filtered = [...filteredCategories]
    if (formData.category_id) {
      const categoryIdInList = filtered.some(c => c.id === formData.category_id)
      if (!categoryIdInList) {
        const categoryToInclude = categories.find(c => c.id === formData.category_id)
        if (categoryToInclude) {
          filtered.unshift(categoryToInclude) // Add at the beginning
        }
      }
    }
    return filtered
  }

  return (
    <React.Fragment>
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Delete Transaction</h2>
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
                Are you sure you want to delete this transaction? This action cannot be undone.
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

      {/* Debt Selection Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Select Loan</h2>
              <button
                onClick={() => {
                  setShowDebtModal(false)
                  setDebtError(null)
                  setSelectedDebtId(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                This transaction appears to be a loan payment. Please select which loan to link it to:
              </p>
              <select
                value={selectedDebtId || ''}
                onChange={(e) => {
                  setSelectedDebtId(e.target.value)
                  setDebtError(null)
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 mb-4"
              >
                <option value="">Select a loan...</option>
                {debts.map((debt) => (
                  <option key={debt.id} value={debt.id}>
                    {debt.name}
                  </option>
                ))}
              </select>
              {debtError && (
                <p className="text-red-600 text-sm mb-4">{debtError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDebtSelect}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowDebtModal(false)
                    setDebtError(null)
                    setSelectedDebtId(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold text-lg min-w-[300px]`}>
          {notification.text}
        </div>
      )}

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
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value)
                          handleNewCategoryInput(e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsAddingCategory(false)
                            setNewCategoryName('')
                            // Reset category
                            setFormData({ 
                              ...formData, 
                              category: '',
                              category_id: ''
                            })
                          }
                        }}
                        placeholder="Category name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                          setFormData({ 
                            ...formData, 
                            category: '',
                            category_id: ''
                          })
                        }}
                        className="px-2 py-2 text-gray-500 hover:text-gray-700"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleCategorySelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required={!isAddingCategory}
                    >
                      <option value="">Select category...</option>
                      {getCategoriesForSelect().map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add new Category</option>
                    </select>
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
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Transaction'}
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
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                    <span>Loading transactions...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {transactions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No transactions found</div>
                    ) : (
                      transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={`group p-4 border rounded-lg cursor-pointer transition ${
                            selectedEditId === transaction.id
                              ? 'bg-indigo-50 border-indigo-500 border-l-4'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              onClick={() => handleSelectEdit(transaction)}
                              className="flex-1"
                            >
                              <div className="font-semibold text-lg">
                                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(() => {
                                  const categoryName = getCategoryName(transaction.category_id)
                                  if (categoryName) {
                                    return `${categoryName} on ${transaction.date}`
                                  }
                                  // Fallback to transaction.category (from API join)
                                  if (transaction.category) {
                                    return `${transaction.category} on ${transaction.date}`
                                  }
                                  return `No category on ${transaction.date}`
                                })()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(transaction.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-500"
                              title="Delete Transaction"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Form */}
              <div className={isDesktop ? 'col-span-2' : selectedEditId ? '' : 'hidden'}>
                {!selectedEditId && !isDesktop && (
                  <p className="text-center text-gray-500 mt-8">Select a transaction from the list to edit.</p>
                )}
                {selectedEditId && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      $ Amount
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
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => {
                                setNewCategoryName(e.target.value)
                                handleNewCategoryInput(e.target.value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setIsAddingCategory(false)
                                  setNewCategoryName('')
                                  // Reset to original category from DB
                                  const originalCategory = categories.find(c => c.id === formData.category_id)
                                  setFormData({ 
                                    ...formData, 
                                    category: originalCategory?.name || '',
                                    category_id: originalCategory?.id || ''
                                  })
                                }
                              }}
                              placeholder="Category name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCategory(false)
                                setNewCategoryName('')
                                // Reset to original category from DB
                                const originalCategory = categories.find(c => c.id === formData.category_id)
                                setFormData({ 
                                  ...formData, 
                                  category: originalCategory?.name || '',
                                  category_id: originalCategory?.id || ''
                                })
                              }}
                              className="px-2 py-2 text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={formData.category_id || ''}
                            onChange={(e) => handleCategorySelect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            required={!isAddingCategory}
                          >
                            <option value="">Select category...</option>
                            {getCategoriesForSelect().map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                            <option value="__add_new__">+ Add new Category</option>
                          </select>
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

                      {formData.debt_id && selectedDebtName && (
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Linked Loan</label>
                          <div className="w-full border border-indigo-200 bg-indigo-50 rounded-lg px-4 py-2 text-indigo-700 font-medium">
                            {selectedDebtName}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Updating...' : 'Update Transaction'}
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
                    href="/accounts"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Connect an Account
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="text-center py-6 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-gray-700 mb-4">Want to connect more accounts?</p>
                      <a
                        href="/accounts"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        Connect an Account
                      </a>
                    </div>
                  </div>
                  {statementItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">No bank statements available.</p>
                      <p className="text-sm text-gray-500">Connect your accounts to see statements here.</p>
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
                            <div className="relative">
                              <input
                                type="text"
                                list="category-list-statements"
                                value={formData.category || ''}
                                onChange={(e) => {
                                  const categoryName = e.target.value
                                  // Try to find matching category
                                  const matchingCategory = categories.find(
                                    c => c.name.toLowerCase() === categoryName.toLowerCase()
                                  )
                                  setFormData({ 
                                    ...formData, 
                                    category: categoryName,
                                    category_id: matchingCategory?.id || ''
                                  })
                                }}
                                placeholder="Type category name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                required
                              />
                              <datalist id="category-list-statements">
                                {getCategoriesForSelect().map((cat) => (
                                  <option key={cat.id} value={cat.name} />
                                ))}
                              </datalist>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Type a category name. It will be created automatically if it doesn't exist.
                            </p>
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
                            disabled={isSaving}
                            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Importing...' : 'Import Transaction'}
                          </button>
                        </form>
                      </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </React.Fragment>
  )
}

