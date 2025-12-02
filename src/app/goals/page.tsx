'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Category {
  id: string
  name: string
  category_type?: 'income' | 'expense'
}

interface BudgetGoal {
  id: string
  category: string  // Category name
  categoryId: string  // Category ID (set after category is created/found)
  amount: number | null  // Amount can be null for placeholder
}

export default function GoalsPage() {
  const { user } = useAuth()
  // Helper functions for sessionStorage
  const getStoredData = (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const setStoredData = (key: string, data: any) => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error storing data:', error)
    }
  }

  // Restore data from sessionStorage on mount
  const restoreFromStorage = (userId: string | undefined) => {
    if (!userId || typeof window === 'undefined') return null
    
    const storedUserId = getStoredData('goals_fetched_user_id')
    if (storedUserId !== userId) return null
    
    const storedCategories = getStoredData('goals_categories')
    const storedGoals = getStoredData('goals_data')
    
    if (storedCategories && storedGoals) {
      // Ensure goals have the correct structure matching backend
      const formatGoals = (goals: any[]): BudgetGoal[] => {
        return (goals || []).map(goal => ({
          id: goal.id || '',
          category: goal.category || '',
          categoryId: goal.categoryId || '',
          amount: goal.amount ?? null,
        }))
      }
      
      return {
        categories: Array.isArray(storedCategories) ? storedCategories : [],
        weeklyGoals: formatGoals(storedGoals.week || []),
        monthlyGoals: formatGoals(storedGoals.month || []),
        yearlyGoals: formatGoals(storedGoals.year || []),
      }
    }
    return null
  }

  // Initialize state - try to restore from sessionStorage first
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window === 'undefined') return []
    const restored = restoreFromStorage(user?.id)
    return restored?.categories || []
  })
  
  const [weeklyGoals, setWeeklyGoals] = useState<BudgetGoal[]>(() => {
    if (typeof window === 'undefined') return []
    const restored = restoreFromStorage(user?.id)
    return restored?.weeklyGoals || []
  })
  
  const [monthlyGoals, setMonthlyGoals] = useState<BudgetGoal[]>(() => {
    if (typeof window === 'undefined') return []
    const restored = restoreFromStorage(user?.id)
    return restored?.monthlyGoals || []
  })
  
  const [yearlyGoals, setYearlyGoals] = useState<BudgetGoal[]>(() => {
    if (typeof window === 'undefined') return []
    const restored = restoreFromStorage(user?.id)
    return restored?.yearlyGoals || []
  })
  
  // Track if we've fetched in this session
  const hasFetchedRef = useRef(false)
  
  // Check if data exists in sessionStorage for current user
  const hasStoredData = () => {
    if (!user?.id || typeof window === 'undefined') return false
    const storedUserId = getStoredData('goals_fetched_user_id')
    const storedData = getStoredData('goals_data')
    return storedUserId === user.id && storedData !== null
  }

  // Initialize isFetching - should be false if we have stored data
  const [isFetching, setIsFetching] = useState(() => {
    if (typeof window === 'undefined') return true
    // If we have stored data, we're not fetching
    return !hasStoredData()
  })
  
  // Compute isLoading: only show loading if we're actually fetching and have no data
  const hasData = categories.length > 0 || weeklyGoals.length > 0 || monthlyGoals.length > 0 || yearlyGoals.length > 0
  const isLoading = isFetching && !hasData && !hasStoredData()

  // Fetch data ONCE per user per session
  useEffect(() => {
    const userId = user?.id
    
    // If no user, don't fetch
    if (!userId) {
      setIsFetching(false)
      return
    }

    // Check if we already have stored data for this user
    const storedUserId = getStoredData('goals_fetched_user_id')
    
    // If we have stored data for this user, restore it instead of fetching
    if (storedUserId === userId) {
      const storedCategories = getStoredData('goals_categories')
      const storedGoals = getStoredData('goals_data')
      
      if (storedCategories && storedGoals) {
        // Restore data from sessionStorage
        const restoredCategories = Array.isArray(storedCategories) ? storedCategories : []
        setCategories(restoredCategories)
        setWeeklyGoals(storedGoals.week || [])
        setMonthlyGoals(storedGoals.month || [])
        setYearlyGoals(storedGoals.year || [])
        hasFetchedRef.current = true
        setIsFetching(false)
        
        // Still fetch categories in background to ensure they're up to date
        fetch('/api/categories?type=expense', {
          cache: 'no-store', // Always fetch fresh
        })
          .then(res => {
            if (res.ok) {
              return res.json()
            }
            throw new Error('Failed to fetch categories')
          })
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setCategories(data)
              setStoredData('goals_categories', data)
              console.log('Refreshed categories from backend:', data.length)
            }
          })
          .catch(err => console.error('Error refreshing categories:', err))
        
        return
      }
    }

    // If we've already fetched in this session, don't fetch again
    if (hasFetchedRef.current) {
      setIsFetching(false)
      return
    }

    // Only fetch if we truly don't have data
    setIsFetching(true)
    
    const fetchData = async () => {
      try {
        // ALWAYS fetch categories from backend - don't rely on cache
        try {
          const categoriesRes = await fetch('/api/categories?type=expense', {
            cache: 'no-store', // Ensure we always fetch fresh data
          })
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json()
            if (Array.isArray(categoriesData)) {
              setCategories(categoriesData)
              setStoredData('goals_categories', categoriesData)
              console.log('Loaded categories from backend:', categoriesData.length, categoriesData)
            } else {
              console.error('Categories data is not an array:', categoriesData)
              setCategories([])
            }
          } else {
            console.error('Failed to fetch categories:', categoriesRes.status, categoriesRes.statusText)
            const errorData = await categoriesRes.json().catch(() => null)
            console.error('Error details:', errorData)
            // Keep existing categories if fetch fails
          }
        } catch (categoryError) {
          console.error('Error fetching categories:', categoryError)
          // Keep existing categories if fetch fails
        }

        // Fetch budget goals
        const goalsRes = await fetch('/api/budget-goals', {
          cache: 'no-store', // Ensure we always fetch fresh data
        })
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          // Ensure goals have the correct structure matching backend
          const formatGoals = (goals: any[]): BudgetGoal[] => {
            return (goals || []).map(goal => ({
              id: goal.id,
              category: goal.category || '',
              categoryId: goal.categoryId || '',
              amount: goal.amount ?? null,
            }))
          }
          
          const formattedWeek = formatGoals(goalsData.week || [])
          const formattedMonth = formatGoals(goalsData.month || [])
          const formattedYear = formatGoals(goalsData.year || [])
          
          setWeeklyGoals(formattedWeek)
          setMonthlyGoals(formattedMonth)
          setYearlyGoals(formattedYear)
          
          // Store goals data
          setStoredData('goals_data', {
            week: formattedWeek,
            month: formattedMonth,
            year: formattedYear,
          })
        }
        
        // Mark as fetched
        setStoredData('goals_fetched_user_id', userId)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsFetching(false)
        hasFetchedRef.current = true
      }
    }

    fetchData()
  }, [user?.id]) // Only depend on user ID - this ensures we don't refetch on tab switches

  // Helper function to sync current state to sessionStorage
  const syncStateToStorage = (newCategories: Category[], newWeeklyGoals: BudgetGoal[], newMonthlyGoals: BudgetGoal[], newYearlyGoals: BudgetGoal[]) => {
    if (typeof window === 'undefined' || !user?.id) return
    
    setStoredData('goals_categories', newCategories)
    setStoredData('goals_data', {
      week: newWeeklyGoals,
      month: newMonthlyGoals,
      year: newYearlyGoals,
    })
    setStoredData('goals_fetched_user_id', user.id)
  }

  const [savingGoals, setSavingGoals] = useState<Set<string>>(new Set())
  const [savedGoals, setSavedGoals] = useState<Set<string>>(new Set())
  const [errorMessages, setErrorMessages] = useState<Map<string, string>>(new Map())
  const [addingCategoryFor, setAddingCategoryFor] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Helper function to find or create a category
  // Helper function to convert string to title case
  const toTitleCase = (str: string): string => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

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
          name: titleCaseName, // Send title case to API
          category_type: 'expense' // Goals page only deals with expense categories
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
      setStoredData('goals_categories', updatedCategories)
      
      // Dispatch event for other components
      window.dispatchEvent(new Event('categories-updated'))
      
      return newCategory
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  const addGoal = (type: 'weekly' | 'monthly' | 'yearly') => {
    const newGoal: BudgetGoal = {
      id: `temp-${Date.now()}-${Math.random()}`,
      category: '',
      categoryId: '',
      amount: null, // Use null instead of 0 for placeholder
    }

    // Clear any "adding category" state when adding a new goal
    setAddingCategoryFor(null)
    setNewCategoryName('')

    let updatedWeeklyGoals = weeklyGoals
    let updatedMonthlyGoals = monthlyGoals
    let updatedYearlyGoals = yearlyGoals

    if (type === 'weekly') {
      updatedWeeklyGoals = [...weeklyGoals, newGoal]
      setWeeklyGoals(updatedWeeklyGoals)
    } else if (type === 'monthly') {
      updatedMonthlyGoals = [...monthlyGoals, newGoal]
      setMonthlyGoals(updatedMonthlyGoals)
    } else {
      updatedYearlyGoals = [...yearlyGoals, newGoal]
      setYearlyGoals(updatedYearlyGoals)
    }
    
    // Sync to sessionStorage
    syncStateToStorage(categories, updatedWeeklyGoals, updatedMonthlyGoals, updatedYearlyGoals)
  }

  const updateGoalInDatabase = async (
    type: 'weekly' | 'monthly' | 'yearly',
    goalId: string,
    categoryId: string,
    amount: number,
    categoryName?: string
  ) => {
    try {
      // Map frontend period type to backend period type
      const periodTypeMap: Record<'weekly' | 'monthly' | 'yearly', 'week' | 'month' | 'year'> = {
        weekly: 'week',
        monthly: 'month',
        yearly: 'year',
      }
      const backendPeriodType = periodTypeMap[type]
      
      const response = await fetch('/api/budget-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goalId.startsWith('temp-') ? undefined : goalId, // Only send real IDs, not temp ones
          categoryId,
          periodType: backendPeriodType,
          amount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to save budget goal'
        console.error('Error saving budget goal:', errorMessage)
        throw new Error(errorMessage)
      }

      const savedGoal = await response.json()
      
      // Get category name from categories list or use provided name
      const finalCategoryName = categoryName || categories.find(c => c.id === categoryId)?.name || ''
      
      // Update local state with saved goal - match backend structure exactly
      const updatedGoal: BudgetGoal = {
        id: savedGoal.id, // Use the ID from backend (replaces temp ID if new)
        category: finalCategoryName,
        categoryId: savedGoal.category_id || categoryId, // Ensure categoryId is set
        amount: savedGoal.amount ? parseFloat(savedGoal.amount) : null,
      }

      let updatedWeeklyGoals = weeklyGoals
      let updatedMonthlyGoals = monthlyGoals
      let updatedYearlyGoals = yearlyGoals

      // Replace temp goal with saved goal (matching backend structure)
      if (type === 'weekly') {
        updatedWeeklyGoals = weeklyGoals.map(g => {
          // Replace if it matches the temp ID or if it's the same goal with real ID
          if (g.id === goalId || (goalId.startsWith('temp-') && g.id === savedGoal.id)) {
            return updatedGoal
          }
          return g
        })
        // Remove duplicates if temp ID was replaced
        if (goalId.startsWith('temp-')) {
          const seen = new Set<string>()
          updatedWeeklyGoals = updatedWeeklyGoals.filter(g => {
            if (seen.has(g.id)) return false
            seen.add(g.id)
            return true
          })
        }
        setWeeklyGoals(updatedWeeklyGoals)
      } else if (type === 'monthly') {
        updatedMonthlyGoals = monthlyGoals.map(g => {
          if (g.id === goalId || (goalId.startsWith('temp-') && g.id === savedGoal.id)) {
            return updatedGoal
          }
          return g
        })
        if (goalId.startsWith('temp-')) {
          const seen = new Set<string>()
          updatedMonthlyGoals = updatedMonthlyGoals.filter(g => {
            if (seen.has(g.id)) return false
            seen.add(g.id)
            return true
          })
        }
        setMonthlyGoals(updatedMonthlyGoals)
      } else {
        updatedYearlyGoals = yearlyGoals.map(g => {
          if (g.id === goalId || (goalId.startsWith('temp-') && g.id === savedGoal.id)) {
            return updatedGoal
          }
          return g
        })
        if (goalId.startsWith('temp-')) {
          const seen = new Set<string>()
          updatedYearlyGoals = updatedYearlyGoals.filter(g => {
            if (seen.has(g.id)) return false
            seen.add(g.id)
            return true
          })
        }
        setYearlyGoals(updatedYearlyGoals)
      }

      // Sync to sessionStorage
      syncStateToStorage(categories, updatedWeeklyGoals, updatedMonthlyGoals, updatedYearlyGoals)

      return savedGoal
    } catch (error: any) {
      console.error('Error updating goal in database:', error)
      // If API returned an error message, throw it to be caught by the caller
      if (error.message) {
        throw error
      }
      return null
    }
  }

  const deleteGoal = async (type: 'weekly' | 'monthly' | 'yearly', id: string) => {
    // Only delete from database if it's a real goal (not temp)
    if (!id.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/budget-goals?id=${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Error deleting budget goal:', error)
          alert('Failed to delete budget goal')
          return
        }
      } catch (error) {
        console.error('Error deleting goal:', error)
        alert('Failed to delete budget goal')
        return
      }
    }

    // Update local state - remove from frontend
    let updatedWeeklyGoals = weeklyGoals
    let updatedMonthlyGoals = monthlyGoals
    let updatedYearlyGoals = yearlyGoals

    if (type === 'weekly') {
      updatedWeeklyGoals = weeklyGoals.filter((g) => g.id !== id)
      setWeeklyGoals(updatedWeeklyGoals)
    } else if (type === 'monthly') {
      updatedMonthlyGoals = monthlyGoals.filter((g) => g.id !== id)
      setMonthlyGoals(updatedMonthlyGoals)
    } else {
      updatedYearlyGoals = yearlyGoals.filter((g) => g.id !== id)
      setYearlyGoals(updatedYearlyGoals)
    }
    
    // Sync to sessionStorage after frontend update
    syncStateToStorage(categories, updatedWeeklyGoals, updatedMonthlyGoals, updatedYearlyGoals)
  }

  const updateGoal = async (
    type: 'weekly' | 'monthly' | 'yearly',
    id: string,
    field: 'category' | 'categoryId' | 'amount',
    value: string | number | null
  ) => {
    // Update local state immediately for UI responsiveness
    let updatedGoal: BudgetGoal | undefined
    let updatedWeeklyGoals = weeklyGoals
    let updatedMonthlyGoals = monthlyGoals
    let updatedYearlyGoals = yearlyGoals

    if (type === 'weekly') {
      updatedWeeklyGoals = weeklyGoals.map((g) => {
        if (g.id === id) {
          const updated = { ...g, [field]: value }
          updatedGoal = updated
          return updated
        }
        return g
      })
      setWeeklyGoals(updatedWeeklyGoals)
    } else if (type === 'monthly') {
      updatedMonthlyGoals = monthlyGoals.map((g) => {
        if (g.id === id) {
          const updated = { ...g, [field]: value }
          updatedGoal = updated
          return updated
        }
        return g
      })
      setMonthlyGoals(updatedMonthlyGoals)
    } else {
      updatedYearlyGoals = yearlyGoals.map((g) => {
        if (g.id === id) {
          const updated = { ...g, [field]: value }
          updatedGoal = updated
          return updated
        }
        return g
      })
      setYearlyGoals(updatedYearlyGoals)
    }

    // Sync to sessionStorage immediately for tab switching persistence
    syncStateToStorage(categories, updatedWeeklyGoals, updatedMonthlyGoals, updatedYearlyGoals)

    // Don't automatically save to database - user must confirm via save button
  }

  const renderGoalTable = (
    goals: BudgetGoal[],
    type: 'weekly' | 'monthly' | 'yearly',
    title: string,
    color: string
  ) => {
    const handleCategorySelect = async (goalId: string, value: string) => {
      // Clear any error for this goal
      setErrorMessages(prev => {
        const newMap = new Map(prev)
        newMap.delete(goalId)
        return newMap
      })

      if (value === '__add_new__') {
        // Show input for adding new category
        setAddingCategoryFor(goalId)
        setNewCategoryName('')
      } else {
        // Category selected from dropdown
        const selectedCategory = categories.find(c => c.id === value)
        if (selectedCategory) {
          // Check for duplicate category in same period
          const duplicateGoal = goals.find(g => 
            g.id !== goalId &&
            g.categoryId === selectedCategory.id &&
            g.amount !== null && g.amount > 0
          )
          
          if (duplicateGoal) {
            setErrorMessages(prev => {
              const newMap = new Map(prev)
              newMap.set(goalId, `${selectedCategory.name} already has a budget goal for ${type === 'weekly' ? 'weekly' : type === 'monthly' ? 'monthly' : 'yearly'} period`)
              return newMap
            })
            return
          }

          await updateGoal(type, goalId, 'category', selectedCategory.name)
          await updateGoal(type, goalId, 'categoryId', selectedCategory.id)
          setAddingCategoryFor(null) // Hide add category input if it was showing
        }
      }
    }

    const handleNewCategoryInput = async (goalId: string, categoryName: string) => {
      // Clear any error for this goal
      setErrorMessages(prev => {
        const newMap = new Map(prev)
        newMap.delete(goalId)
        return newMap
      })

      // Check for duplicate category in same period (case-insensitive)
      if (categoryName && categoryName.trim()) {
        const trimmedName = categoryName.trim().toLowerCase()
        const duplicateGoal = goals.find(g => 
          g.id !== goalId &&
          g.category && 
          g.category.toLowerCase() === trimmedName &&
          g.amount !== null && g.amount > 0
        )
        
        if (duplicateGoal) {
          setErrorMessages(prev => {
            const newMap = new Map(prev)
            newMap.set(goalId, `${categoryName.trim()} already has a budget goal for ${type === 'weekly' ? 'weekly' : type === 'monthly' ? 'monthly' : 'yearly'} period`)
            return newMap
          })
          return
        }
      }

      // Update category name in local state (categoryId will be set on save)
      await updateGoal(type, goalId, 'category', categoryName)
      await updateGoal(type, goalId, 'categoryId', '') // Clear categoryId until we find/create it
    }

    const handleSaveGoal = async (goalId: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      // Clear previous errors
      setErrorMessages(prev => {
        const newMap = new Map(prev)
        newMap.delete(goalId)
        return newMap
      })

      // Skip category validation - save button only shows when category is valid

      // Validation: Check for duplicate category in same period
      // Only check for duplicates if amount is set (to avoid blocking empty goals)
      if (goal.amount !== null && goal.amount > 0) {
        const existingGoalInPeriod = goals.find(g => 
          g.id !== goalId && 
          ((g.categoryId && goal.categoryId && g.categoryId === goal.categoryId) ||
           (g.category && goal.category && g.category.toLowerCase() === goal.category.toLowerCase().trim())) &&
          g.amount !== null && g.amount > 0
        )
        if (existingGoalInPeriod) {
          setErrorMessages(prev => {
            const newMap = new Map(prev)
            const categoryName = goal.category || categories.find(c => c.id === goal.categoryId)?.name || 'this category'
            newMap.set(goalId, `${categoryName} already has a budget goal for ${type === 'weekly' ? 'weekly' : type === 'monthly' ? 'monthly' : 'yearly'} period`)
            return newMap
          })
          return
        }
      }

      // Validation: Check amount is not null, undefined, or zero
      if (goal.amount === null || goal.amount === undefined || goal.amount <= 0) {
        setErrorMessages(prev => {
          const newMap = new Map(prev)
          newMap.set(goalId, 'Budget amount must be greater than 0')
          return newMap
        })
        return
      }

      // Validation: Check amount is not negative (shouldn't happen with number input, but double check)
      if (goal.amount < 0) {
        setErrorMessages(prev => {
          const newMap = new Map(prev)
          newMap.set(goalId, 'Budget amount cannot be negative')
          return newMap
        })
        return
      }

      // Mark as saving
      setSavingGoals(prev => new Set(prev).add(goalId))
      setSavedGoals(prev => {
        const newSet = new Set(prev)
        newSet.delete(goalId)
        return newSet
      })

      try {
        let categoryId = goal.categoryId
        // Get category name from goal.category OR from newCategoryName if actively typing new category
        let categoryName = goal.category
        if (!categoryName && addingCategoryFor === goalId && newCategoryName) {
          categoryName = newCategoryName
        }

        // If categoryId is set but category name is missing, get it from categories list
        if (categoryId && !categoryName) {
          const category = categories.find(c => c.id === categoryId)
          if (category) {
            categoryName = category.name
            // Update goal with category name
            await updateGoal(type, goalId, 'category', categoryName)
          }
        }

        // If categoryId is not set but category name is, find or create the category
        if (!categoryId && categoryName && categoryName.trim()) {
          // Convert to title case before finding/creating
          const trimmedName = categoryName.trim()
          const category = await findOrCreateCategory(trimmedName)
          
          if (!category) {
            setErrorMessages(prev => {
              const newMap = new Map(prev)
              newMap.set(goalId, 'Failed to create or find category')
              return newMap
            })
            return
          }
          
          categoryId = category.id
          categoryName = category.name // This will be in title case from findOrCreateCategory
          
          // Update goal with categoryId and category name (title case)
          await updateGoal(type, goalId, 'categoryId', categoryId)
          await updateGoal(type, goalId, 'category', categoryName)
        }
        
        // If we still don't have a categoryId, something went wrong
        if (!categoryId) {
          console.error('CategoryId missing - categoryName was:', categoryName, 'goal.category:', goal.category)
          return
        }
        
        // Save to database with the categoryId
        const saved = await updateGoalInDatabase(type, goalId, categoryId, goal.amount, categoryName)
        
        if (!saved) {
          throw new Error('Failed to save goal to database')
        }

        // Clear errors
        setErrorMessages(prev => {
          const newMap = new Map(prev)
          newMap.delete(goalId)
          return newMap
        })

        // Mark as saved (show checkmark)
        setSavedGoals(prev => new Set(prev).add(goalId))
        
        // Show notification
        const isNewGoal = goalId.startsWith('temp-')
        setNotification({
          text: isNewGoal 
            ? 'Budget goal saved successfully!' 
            : 'Budget goal updated successfully!',
          type: 'success'
        })
        setTimeout(() => setNotification(null), 3000)
        
        // Hide checkmark after 2 seconds
        setTimeout(() => {
          setSavedGoals(prev => {
            const newSet = new Set(prev)
            newSet.delete(goalId)
            return newSet
          })
        }, 2000)
      } catch (error: any) {
        // Handle error
        setErrorMessages(prev => {
          const newMap = new Map(prev)
          newMap.set(goalId, error.message || 'Failed to save goal')
          return newMap
        })
      } finally {
        setSavingGoals(prev => {
          const newSet = new Set(prev)
          newSet.delete(goalId)
          return newSet
        })
      }
    }

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className={`text-2xl font-bold ${color} mb-4 border-b pb-2`}>
          {title}
        </h2>
        
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No budget goals set. Click &quot;Add Goal&quot; to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Budget Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 w-32">Actions</th>
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
                      <div className="w-full">
                        {addingCategoryFor === goal.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => {
                                setNewCategoryName(e.target.value)
                                handleNewCategoryInput(goal.id, e.target.value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setAddingCategoryFor(null)
                                  setNewCategoryName('')
                                  // Reset category
                                  updateGoal(type, goal.id, 'category', '')
                                  updateGoal(type, goal.id, 'categoryId', '')
                                }
                              }}
                              placeholder="Category name"
                              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                errorMessages.has(goal.id) 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-gray-300'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                setAddingCategoryFor(null)
                                setNewCategoryName('')
                              }}
                              className="px-2 py-2 text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={goal.categoryId || ''}
                            onChange={(e) => handleCategorySelect(goal.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                              errorMessages.has(goal.id) 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select category...</option>
                            {categories
                              .filter(cat => {
                                // Don't show categories that are already used in this period
                                const alreadyUsed = goals.some(g => 
                                  g.id !== goal.id &&
                                  g.categoryId === cat.id &&
                                  g.amount !== null && 
                                  g.amount > 0 &&
                                  !g.id.startsWith('temp-')
                                )
                                return !alreadyUsed
                              })
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            <option value="__add_new__">+ Add new Category</option>
                          </select>
                        )}
                        {errorMessages.has(goal.id) && (
                          <p className="text-red-500 text-xs mt-1">{errorMessages.get(goal.id)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-bold text-gray-500">$</span>
                        <input
                          type="number"
                          value={goal.amount === null || goal.amount === undefined || goal.amount === 0 ? '' : goal.amount}
                          onChange={async (e) => {
                            const value = e.target.value
                            // If empty, set to null for placeholder, otherwise parse as number
                            const amount = value === '' ? null : (parseFloat(value) || null)
                            await updateGoal(type, goal.id, 'amount', amount)
                            // Don't save automatically - user must click save button
                          }}
                          className="w-32 text-right font-bold text-gray-900 focus:bg-gray-50 rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {(() => {
                          // ULTRA SIMPLE: Any text in category + any number in amount = SHOW BUTTON
                          // Check goal.category OR newCategoryName (when actively typing)
                          const currentCategoryText = (addingCategoryFor === goal.id && newCategoryName) 
                            ? newCategoryName 
                            : (goal.category || '')
                          const hasCategory = !!(goal.categoryId || (currentCategoryText && currentCategoryText.trim().length > 0))
                          const hasAmount = !!(goal.amount && goal.amount > 0)
                          
                          if (!hasCategory || !hasAmount) {
                            return <span className="text-xs text-gray-400 italic">Set both fields</span>
                          }
                          
                          return (
                            <button
                              onClick={() => handleSaveGoal(goal.id)}
                              disabled={savingGoals.has(goal.id)}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                savedGoals.has(goal.id)
                                  ? 'bg-green-100 text-green-700 cursor-default'
                                  : savingGoals.has(goal.id)
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                              title={goal.id.startsWith('temp-') ? 'Save goal' : 'Update goal'}
                            >
                              {savingGoals.has(goal.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin inline" />
                              ) : savedGoals.has(goal.id) ? (
                                <Check className="w-4 h-4 inline" />
                              ) : goal.id.startsWith('temp-') ? (
                                'Save'
                              ) : (
                                'Update'
                              )}
                            </button>
                          )
                        })()}
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading budget goals...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.text}</span>
            </div>
          </div>
        </div>
      )}
      
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
