-- Migration: Add interest_period and interest_start_date to debts table
-- This allows loans to have different interest calculation periods (daily, monthly, annually)
-- and a separate date when interest starts accruing (which may differ from loan start date)

-- Add interest_period enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interest_period') THEN
        CREATE TYPE interest_period AS ENUM ('daily', 'monthly', 'annually');
    END IF;
END $$;

-- Add interest_period column to debts table
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS interest_period interest_period NOT NULL DEFAULT 'monthly';

-- Add interest_start_date column to debts table
-- This is the date when interest starts accruing (may be different from start_date)
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS interest_start_date DATE;

-- Set interest_start_date to start_date for existing records if it's NULL
UPDATE debts 
SET interest_start_date = start_date 
WHERE interest_start_date IS NULL;

-- Make interest_start_date NOT NULL after setting defaults
ALTER TABLE debts 
ALTER COLUMN interest_start_date SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_debts_interest_start_date ON debts(interest_start_date);

-- Add comment for documentation
COMMENT ON COLUMN debts.interest_period IS 'Period for interest calculation: daily, monthly, or annually';
COMMENT ON COLUMN debts.interest_start_date IS 'Date when interest starts accruing (may differ from loan start date)';

