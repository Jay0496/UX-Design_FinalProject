# Migration Guide: Category Type (Income/Expense) Implementation

This document outlines the changes made to add category types (income/expense) to the application.

## Database Changes

### SQL Migration File: `supabase/migrations/add_category_type.sql`

This migration:
1. Creates a `category_type` ENUM with values 'income' and 'expense'
2. Adds `category_type` column to the `categories` table (defaults to 'expense')
3. Updates existing categories to set type based on name patterns
4. Updates the `create_default_categories()` function to include category types
5. Adds an index on `category_type` for better query performance

**To apply this migration:**
```sql
-- Run the SQL file in your Supabase SQL editor or via migration tool
```

### Affected Tables

1. **categories** - Added `category_type` column
   - Existing categories default to 'expense'
   - Income categories are identified by patterns in names

2. **budget_goals** - No schema changes, but API now filters by category type
   - Only expense categories can have budget goals

3. **transactions** - No schema changes
   - Can use both income and expense categories

## Code Changes

### 1. Category Interface Updated
- `Category` interface now includes optional `category_type?: 'income' | 'expense'`

### 2. Categories API (`src/app/api/categories/route.ts`)
- **GET**: Added `?type=expense` or `?type=income` query parameter support
- **POST**: Now accepts `category_type` field (defaults to 'expense' if not provided)
- Categories API now includes `category_type` in responses

### 3. Budget Goals API (`src/app/api/budget-goals/route.ts`)
- Filters out income categories when fetching budget goals
- Only returns goals for expense categories

### 4. Goals Page (`src/app/goals/page.tsx`)
- Fetches only expense categories (`/api/categories?type=expense`)
- New categories created from goals page are automatically set to 'expense'
- **Major UX Change**: Goals now require explicit confirmation before saving
  - Added "Save" button that appears when both category and amount are set
  - Goals are NOT automatically saved to database
  - User must click "Save" or "Update" button to persist changes
  - Visual feedback: Loading spinner while saving, checkmark on success

### 5. Default Categories Function (`src/lib/categories.ts`)
- Removed income categories from default list (they're now managed separately)
- Note: This function is mainly for backward compatibility

## Key Features

### Budget Goals Page Behavior

1. **Only Expense Categories Shown**: The goals page only displays and allows selection of expense categories

2. **Explicit Save Confirmation**: 
   - Users can edit category and amount in local state
   - Changes are persisted in sessionStorage for tab switching
   - Changes are NOT saved to database until user clicks "Save"/"Update" button
   - Both category and amount must be set before saving is allowed

3. **Visual Feedback**:
   - "Set both fields" message when fields are incomplete
   - "Save" button for new goals (temp IDs)
   - "Update" button for existing goals
   - Loading spinner during save operation
   - Green checkmark on successful save (disappears after 2 seconds)

## Migration Steps

### For New Installations

If you're setting up a fresh database, use the complete setup script:

1. Run `supabase/db_setup.sql` - This includes everything including category_type support
2. No migration needed!

### For Existing Installations

If you already have a database without category_type support:

1. **Run the SQL migration** in your Supabase dashboard:
   - Open Supabase SQL Editor
   - Copy contents of `supabase/migrations/add_category_type.sql`
   - Execute the SQL
   - The migration is safe and checks if objects exist before creating/modifying them

2. **Verify existing categories**:
   ```sql
   SELECT name, category_type FROM categories;
   ```
   - Check that income categories are properly identified
   - Manually update any that were missed:
     ```sql
     UPDATE categories SET category_type = 'income' WHERE name = 'Your Income Category';
     ```

3. **Verify migration completed**:
   ```sql
   -- Check that column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'categories' AND column_name = 'category_type';
   
   -- Check that function was updated
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name = 'create_default_categories';
   ```

4. **Test the application**:
   - Verify goals page only shows expense categories
   - Test adding new categories from goals page (should be expense)
   - Test the save button functionality
   - Verify existing budget goals still work
   - Create a new test user to verify default categories are created with types

## Breaking Changes

None - all changes are backward compatible:
- Existing categories default to 'expense'
- Existing budget goals continue to work
- The goals page now requires explicit save, but old behavior was auto-save which still works through the save button

## Notes

- Income categories should be managed separately (e.g., in a transactions or income page)
- Budget goals are explicitly for expenses only
- The migration handles existing data gracefully by defaulting to 'expense'

