-- Database Schema Setup for Expense Tracker
-- This file contains all table definitions, indexes, functions, and constraints
-- Updated to include category_type support from the start

-- Enable UUID extension (PostgreSQL/Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE period_type AS ENUM ('week', 'month', 'year');
CREATE TYPE transaction_type AS ENUM ('expense', 'income');

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- User-specific expense/income categories
-- Each user can create, read, update, and delete their own categories
-- Default categories are created on user signup via function
-- Categories have a type: 'income' or 'expense'

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_type category_type NOT NULL DEFAULT 'expense',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(category_type);

-- ============================================================================
-- BUDGET GOALS TABLE
-- ============================================================================
-- Budget allocations for categories by period (week, month, year)
-- Separate rows allow different categories to have budgets for different periods
-- Example: "Rent" only monthly, "Coffee" weekly and monthly
-- Note: Budget goals are only for expense categories

CREATE TABLE budget_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id, period_type)
);

CREATE INDEX idx_budget_goals_user_category ON budget_goals(user_id, category_id);

-- ============================================================================
-- DEBTS TABLE
-- ============================================================================
-- User's loans and debts
-- Payment history is tracked via transactions table (debt_id foreign key)

-- Create interest_period enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interest_period') THEN
        CREATE TYPE interest_period AS ENUM ('daily', 'monthly', 'annually');
    END IF;
END $$;

CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    principal DECIMAL(10,2) NOT NULL CHECK (principal >= 0),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
    interest_period interest_period NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    interest_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_interest_start_date ON debts(interest_start_date);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- All financial transactions (expenses and income)
-- Loan payments are linked via debt_id foreign key
-- Amount: positive for income, negative for expenses
-- Can use both income and expense categories

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    account TEXT,
    notes TEXT,
    debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_debt ON transactions(debt_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create default categories for a new user
-- Categories are properly typed as 'income' or 'expense'
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO categories (user_id, name, category_type) VALUES
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Trigger function to handle new user creation
-- Automatically creates default categories when a user signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_default_categories(NEW.id);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE WARNING 'Error creating default categories: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
-- Note: This trigger must be created AFTER the categories table exists
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Categories: Users can only access their own categories
CREATE POLICY "Users can view their own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);

-- Budget Goals: Users can only access their own budget goals
CREATE POLICY "Users can view their own budget goals"
    ON budget_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget goals"
    ON budget_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget goals"
    ON budget_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget goals"
    ON budget_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Debts: Users can only access their own debts
CREATE POLICY "Users can view their own debts"
    ON debts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
    ON debts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
    ON debts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
    ON debts FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions: Users can only access their own transactions
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All tables use UUID primary keys for better distribution and security
-- 2. Foreign keys use CASCADE DELETE for user_id (cleanup on user deletion)
-- 3. Foreign keys use SET NULL for category_id and debt_id (preserve transactions)
-- 4. Indexes are created on foreign keys and common query patterns
-- 5. RLS policies ensure users can only access their own data
-- 6. Default categories function creates both income and expense categories
-- 7. Payment history for debts is calculated by querying transactions WHERE debt_id = debts.id
-- 8. Categories have a type field ('income' or 'expense') to distinguish between them
-- 9. Budget goals are only for expense categories (enforced in application logic)
