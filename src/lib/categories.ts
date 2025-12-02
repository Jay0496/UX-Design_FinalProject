// Shared categories management for the app
// This ensures categories added in Goals page sync with Dashboard

const CATEGORIES_KEY = 'financepro_categories'

export function getCategories(): string[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(CATEGORIES_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultCategories()
    }
  }
  return getDefaultCategories()
}

export function getDefaultCategories(): string[] {
  // Student-appropriate categories (expense categories only for backwards compatibility)
  // Note: Income categories are now managed separately in the database
  return [
    // Week categories
    'Groceries',
    'Food/Dining',
    'Coffee',
    'Transport',
    'Entertainment',
    // Month categories
    'Rent',
    'Textbooks',
    // Year categories
    'Transportation',
    // Additional student categories
    'Tuition',
    'Fees',
    'Campus Dining',
    'Streaming',
    'Shopping',
    'Utilities',
    'Other Bills',
  ]
}

export function addCategory(category: string): void {
  if (typeof window === 'undefined') return
  
  const categories = getCategories()
  if (!categories.includes(category.trim())) {
    const updated = [...categories, category.trim()]
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated))
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('categories-updated'))
  }
}

export function setCategories(categories: string[]): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  window.dispatchEvent(new Event('categories-updated'))
}

