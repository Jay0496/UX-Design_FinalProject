-- Migration: Add category_type column to categories table
-- This migration adds support for income and expense categories
-- Safe version that checks if objects exist before creating/modifying them

-- Step 1: Create the category_type enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add the category_type column only if table exists and column doesn't exist
DO $$ 
BEGIN
    -- Check if categories table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        -- Add column only if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'categories' AND column_name = 'category_type'
        ) THEN
            ALTER TABLE categories 
            ADD COLUMN category_type category_type NOT NULL DEFAULT 'expense';
        END IF;
    END IF;
END $$;

-- Step 3: Update existing categories to set type based on name patterns (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        UPDATE categories 
        SET category_type = 'income'
        WHERE (name ILIKE '%income%' 
           OR name ILIKE '%(income)%'
           OR name ILIKE '%salary%'
           OR name ILIKE '%wage%'
           OR name ILIKE '%scholarship%'
           OR name ILIKE '%grant%')
        AND (category_type IS NULL OR category_type = 'expense');
    END IF;
END $$;

-- Step 4: Update the create_default_categories function to include category_type
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, category_type) VALUES
        (user_uuid, 'Groceries', 'expense'),
        (user_uuid, 'Rent', 'expense'),
        (user_uuid, 'Food/Dining', 'expense'),
        (user_uuid, 'Coffee', 'expense'),
        (user_uuid, 'Transport', 'expense'),
        (user_uuid, 'Entertainment', 'expense'),
        (user_uuid, 'Textbooks', 'expense'),
        (user_uuid, 'Transportation', 'expense'),
        (user_uuid, 'Part-time Job', 'income'),
        (user_uuid, 'Scholarship', 'income'),
        (user_uuid, 'Loan Payment', 'expense')
    ON CONFLICT (user_id, name) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, ignore
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add index on category_type (only if table exists and column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'category_type'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
    END IF;
END $$;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN categories.category_type IS 'Type of category: income or expense';
