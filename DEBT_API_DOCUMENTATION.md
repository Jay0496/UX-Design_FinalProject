# Debt Management API Documentation

This document describes the debt management system, including database schema, API routes, and usage examples.

## Database Schema

### Debts Table

The `debts` table stores user loans and debts with the following fields:

```sql
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
```

#### Fields

- **id**: Unique identifier for the debt
- **user_id**: Foreign key to the authenticated user
- **name**: Name/description of the debt (e.g., "Federal Student Loan")
- **principal**: Initial loan amount (must be >= 0)
- **interest_rate**: Annual interest rate as a percentage (e.g., 5.5 for 5.5%)
- **interest_period**: How often interest is calculated (`daily`, `monthly`, or `annually`)
- **start_date**: Date when the loan was taken out
- **interest_start_date**: Date when interest starts accruing (may differ from start_date)
- **created_at**: Timestamp when the debt was created
- **updated_at**: Timestamp when the debt was last updated

#### Interest Period Types

- **daily**: Interest is calculated daily (365 periods per year)
- **monthly**: Interest is calculated monthly (12 periods per year)
- **annually**: Interest is calculated annually (1 period per year)

### Payment History

Debt payments are tracked through the `transactions` table using the `debt_id` foreign key. When a transaction has a `debt_id`, it represents a payment toward that debt.

## API Routes

All API routes are located at `/api/debts` and require authentication.

### GET /api/debts

Fetches all debts for the authenticated user, including payment history.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Federal Student Loan",
    "principal": 18500.00,
    "interestRate": 5.5,
    "interestPeriod": "monthly",
    "startDate": "2023-09-01",
    "interestStartDate": "2023-09-01",
    "payments": [
      {
        "date": "2023-10-01",
        "amount": 150.00
      }
    ]
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

### POST /api/debts

Creates a new debt for the authenticated user.

**Request Body:**
```json
{
  "name": "Federal Student Loan",
  "principal": 18500.00,
  "interestRate": 5.5,
  "interestPeriod": "monthly",
  "startDate": "2023-09-01",
  "interestStartDate": "2023-09-01"
}
```

**Required Fields:**
- `name`: Debt name (non-empty string)
- `principal`: Initial loan amount (>= 0)
- `interestRate`: Annual interest rate (>= 0)
- `startDate`: Loan start date (ISO date string)

**Optional Fields:**
- `interestPeriod`: Interest calculation period (`daily`, `monthly`, `annually`) - defaults to `monthly`
- `interestStartDate`: Date when interest starts accruing - defaults to `startDate`

**Response:**
```json
{
  "id": "uuid",
  "name": "Federal Student Loan",
  "principal": 18500.00,
  "interestRate": 5.5,
  "interestPeriod": "monthly",
  "startDate": "2023-09-01",
  "interestStartDate": "2023-09-01",
  "payments": []
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `500`: Server error

### PUT /api/debts

Updates an existing debt. Only provided fields will be updated.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Loan Name",
  "principal": 20000.00,
  "interestRate": 6.0,
  "interestPeriod": "daily",
  "startDate": "2023-09-01",
  "interestStartDate": "2023-10-01"
}
```

**Required Fields:**
- `id`: Debt ID to update

**Optional Fields:**
- `name`: Updated debt name
- `principal`: Updated principal amount
- `interestRate`: Updated interest rate
- `interestPeriod`: Updated interest period
- `startDate`: Updated start date
- `interestStartDate`: Updated interest start date

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Loan Name",
  "principal": 20000.00,
  "interestRate": 6.0,
  "interestPeriod": "daily",
  "startDate": "2023-09-01",
  "interestStartDate": "2023-10-01",
  "payments": [...]
}
```

**Status Codes:**
- `200`: Updated successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `404`: Debt not found
- `500`: Server error

### DELETE /api/debts?id={debtId}

Deletes a debt. Related transactions are preserved (debt_id is set to NULL).

**Query Parameters:**
- `id`: Debt ID to delete

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200`: Deleted successfully
- `400`: Bad request (missing ID)
- `401`: Unauthorized
- `404`: Debt not found
- `500`: Server error

## Interest Calculation

Interest is calculated based on the `interest_period` field:

- **Daily**: `principal * (rate / 100) / 365 * days`
- **Monthly**: `principal * (rate / 100) / 12 * months`
- **Annually**: `principal * (rate / 100) * years`

The calculation uses simple interest and is applied from the `interest_start_date` (not the loan `start_date`).

## Chart Data Calculation

The debt page calculates balance history by:

1. Starting with the principal at the loan `start_date`
2. Adding interest from `interest_start_date` based on the `interest_period`
3. Subtracting payments (from transactions with `debt_id`)
4. Generating data points for each payment and the current date

The chart always starts from the loan `start_date` and shows the balance over time, accounting for interest accrual and payments.

## Database Migration

To add the new `interest_period` and `interest_start_date` fields to an existing database, run:

```sql
-- See supabase/migrations/add_debt_interest_fields.sql
```

This migration:
1. Creates the `interest_period` ENUM type
2. Adds `interest_period` column (defaults to 'monthly')
3. Adds `interest_start_date` column
4. Sets `interest_start_date` to `start_date` for existing records
5. Makes `interest_start_date` NOT NULL
6. Creates an index for better query performance

## TypeScript Interface

```typescript
interface Debt {
  id: string
  name: string
  principal: number
  interestRate: number
  interestPeriod: 'daily' | 'monthly' | 'annually'
  startDate: string
  interestStartDate: string
  payments: Payment[]
}

interface Payment {
  date: string
  amount: number
}
```

## Example Usage

### Creating a New Debt

```typescript
const response = await fetch('/api/debts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Federal Student Loan',
    principal: 18500,
    interestRate: 5.5,
    interestPeriod: 'monthly',
    startDate: '2023-09-01',
    interestStartDate: '2023-09-01',
  }),
})

const newDebt = await response.json()
```

### Updating a Debt

```typescript
const response = await fetch('/api/debts', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'debt-uuid',
    interestRate: 6.0,
    interestPeriod: 'daily',
  }),
})

const updatedDebt = await response.json()
```

### Fetching All Debts

```typescript
const response = await fetch('/api/debts')
const debts = await response.json()
```

### Deleting a Debt

```typescript
const response = await fetch(`/api/debts?id=${debtId}`, {
  method: 'DELETE',
})
```

