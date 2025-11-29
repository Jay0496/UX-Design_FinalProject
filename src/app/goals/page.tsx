'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { getCategories, addCategory } from '@/lib/categories'

interface BudgetGoal {
  id: string
  category: string
  amount: number
}

// Categories and budgets from dashboard bar graph (student-appropriate)
const DASHBOARD_GOALS = {
  week: {
    categories: ['Groceries', 'Food/Dining', 'Coffee', 'Transport', 'Entertainment'],
    budgets: [60, 100, 30, 40, 50],
  },
  month: {
    categories: ['Rent', 'Groceries', 'Textbooks', 'Transport', 'Entertainment'],
    budgets: [600, 200, 150, 150, 250],
  },
  year: {
    categories: ['Rent', 'Groceries', 'Textbooks', 'Transportation', 'Entertainment'],
    budgets: [7200, 2400, 1800, 1800, 3000],
  },
}

export default function GoalsPage() {
  const [categories, setCategories] = useState<string[]>([])
  
  // Initialize goals with categories and budgets from dashboard bar graph
  const initializeGoals = () => {
    const weekly: BudgetGoal[] = DASHBOARD_GOALS.week.categories.map((cat, idx) => ({
      id: `weekly-${idx}`,
      category: cat,
      amount: DASHBOARD_GOALS.week.budgets[idx] || 0,
    }))
    
    const monthly: BudgetGoal[] = DASHBOARD_GOALS.month.categories.map((cat, idx) => ({
      id: `monthly-${idx}`,
      category: cat,
      amount: DASHBOARD_GOALS.month.budgets[idx] || 0,
    }))
    
    const yearly: BudgetGoal[] = DASHBOARD_GOALS.year.categories.map((cat, idx) => ({
      id: `yearly-${idx}`,
      category: cat,
      amount: DASHBOARD_GOALS.year.budgets[idx] || 0,
    }))
    
    return { weekly, monthly, yearly }
  }
  
  const initialGoals = initializeGoals()
  const [weeklyGoals, setWeeklyGoals] = useState<BudgetGoal[]>(initialGoals.weekly)
  const [monthlyGoals, setMonthlyGoals] = useState<BudgetGoal[]>(initialGoals.monthly)
  const [yearlyGoals, setYearlyGoals] = useState<BudgetGoal[]>(initialGoals.yearly)

  // Load categories and listen for updates
  useEffect(() => {
    const loadCategories = () => {
      setCategories(getCategories())
    }
    
    loadCategories()
    
    // Listen for category updates from other components
    window.addEventListener('categories-updated', loadCategories)
    
    return () => {
      window.removeEventListener('categories-updated', loadCategories)
    }
  }, [])

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategoryFor, setAddingCategoryFor] = useState<{
    type: 'weekly' | 'monthly' | 'yearly'
    goalId: string
  } | null>(null)

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      addCategory(newCategoryName.trim())
      setCategories([...categories, newCategoryName.trim()])
      
      // Set the new category for the goal that was adding it
      if (addingCategoryFor) {
        const { type, goalId } = addingCategoryFor
        if (type === 'weekly') {
          setWeeklyGoals(
            weeklyGoals.map((g) =>
              g.id === goalId ? { ...g, category: newCategoryName.trim() } : g
            )
          )
        } else if (type === 'monthly') {
          setMonthlyGoals(
            monthlyGoals.map((g) =>
              g.id === goalId ? { ...g, category: newCategoryName.trim() } : g
            )
          )
        } else {
          setYearlyGoals(
            yearlyGoals.map((g) =>
              g.id === goalId ? { ...g, category: newCategoryName.trim() } : g
            )
          )
        }
      }
      
      setIsAddingCategory(false)
      setNewCategoryName('')
      setAddingCategoryFor(null)
    }
  }

  const addGoal = (type: 'weekly' | 'monthly' | 'yearly') => {
    const newGoal: BudgetGoal = {
      id: `goal-${Date.now()}-${Math.random()}`,
      category: '',
      amount: 0,
    }

    if (type === 'weekly') {
      setWeeklyGoals([...weeklyGoals, newGoal])
    } else if (type === 'monthly') {
      setMonthlyGoals([...monthlyGoals, newGoal])
    } else {
      setYearlyGoals([...yearlyGoals, newGoal])
    }
  }

  const deleteGoal = (type: 'weekly' | 'monthly' | 'yearly', id: string) => {
    if (type === 'weekly') {
      setWeeklyGoals(weeklyGoals.filter((g) => g.id !== id))
    } else if (type === 'monthly') {
      setMonthlyGoals(monthlyGoals.filter((g) => g.id !== id))
    } else {
      setYearlyGoals(yearlyGoals.filter((g) => g.id !== id))
    }
  }

  const updateGoal = (
    type: 'weekly' | 'monthly' | 'yearly',
    id: string,
    field: 'category' | 'amount',
    value: string | number
  ) => {
    if (type === 'weekly') {
      setWeeklyGoals(
        weeklyGoals.map((g) => (g.id === id ? { ...g, [field]: value } : g))
      )
    } else if (type === 'monthly') {
      setMonthlyGoals(
        monthlyGoals.map((g) => (g.id === id ? { ...g, [field]: value } : g))
      )
    } else {
      setYearlyGoals(
        yearlyGoals.map((g) => (g.id === id ? { ...g, [field]: value } : g))
      )
    }
  }

  const renderGoalTable = (
    goals: BudgetGoal[],
    type: 'weekly' | 'monthly' | 'yearly',
    title: string,
    color: string
  ) => {
    const handleCategorySelect = (goalId: string, value: string) => {
      if (value === '__add_new__') {
        setIsAddingCategory(true)
        setAddingCategoryFor({ type, goalId })
      } else {
        updateGoal(type, goalId, 'category', value)
      }
    }

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className={`text-2xl font-bold ${color} mb-4 border-b pb-2`}>
          {title}
        </h2>
        
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No budget goals set. Click "Add Goal" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Budget Amount</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr
                    key={goal.id}
                    className="border-b border-gray-100 hover:bg-gray-50 group"
                  >
                    <td className="py-3 px-4">
                      {isAddingCategory && addingCategoryFor?.goalId === goal.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCategory()
                              } else if (e.key === 'Escape') {
                                setIsAddingCategory(false)
                                setNewCategoryName('')
                                setAddingCategoryFor(null)
                              }
                            }}
                            placeholder="Category name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={handleAddCategory}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingCategory(false)
                              setNewCategoryName('')
                              setAddingCategoryFor(null)
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <select
                          value={goal.category}
                          onChange={(e) => handleCategorySelect(goal.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Select category...</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__add_new__">+ Add new Category</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-bold text-gray-500">$</span>
                        <input
                          type="number"
                          value={goal.amount}
                          onChange={(e) =>
                            updateGoal(
                              type,
                              goal.id,
                              'amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-32 text-right font-bold text-gray-900 focus:bg-gray-50 rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteGoal(type, goal.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-500"
                        title="Delete Goal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <button
          onClick={() => addGoal(type)}
          className={`mt-4 flex items-center font-semibold transition-colors ${
            type === 'weekly'
              ? 'text-gray-500 hover:text-indigo-600'
              : type === 'monthly'
              ? 'text-gray-500 hover:text-orange-500'
              : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <Plus className="w-5 h-5 mr-1" />
          Add Goal
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Define Your Budget Goals
        </h1>
        <p className="text-center text-gray-500 mb-10">
          Set your limits for weekly, monthly, and yearly spending. These goals
          power your dashboard progress bars.
        </p>

        {/* Vertical Layout - Stacked Sections */}
        <div className="space-y-8">
          {/* Weekly Goals */}
          {renderGoalTable(
            weeklyGoals,
            'weekly',
            'Weekly Goals',
            'text-indigo-600'
          )}

          {/* Monthly Goals */}
          {renderGoalTable(
            monthlyGoals,
            'monthly',
            'Monthly Goals',
            'text-orange-500'
          )}

          {/* Yearly Goals */}
          {renderGoalTable(
            yearlyGoals,
            'yearly',
            'Yearly Goals',
            'text-green-500'
          )}
        </div>
      </div>
    </main>
  )
}
