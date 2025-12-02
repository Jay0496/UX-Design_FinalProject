# Supabase Setup Guide

This guide covers both database setup and authentication configuration for the Expense Tracker application.

## 📋 Table of Contents

1. [Database Schema Setup](#database-schema-setup)
2. [Authentication Configuration](#authentication-configuration)
3. [Testing](#testing)
4. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Schema Setup

### Overview

The application uses the following database structure:

- **Categories**: User-specific income and expense categories (with `category_type` field)
- **Budget Goals**: Budget allocations for expense categories by period (week/month/year)
- **Transactions**: All financial transactions (expenses and income)
- **Debts**: User loans and debts (with interest period and interest start date support)

### Key Features

- ✅ Categories are typed as either 'income' or 'expense'
- ✅ Budget goals are only for expense categories
- ✅ Automatic default category creation when users sign up
- ✅ Row Level Security (RLS) enabled on all tables

### Quick Start: Database Setup

**For fresh installations:**

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase/db_setup.sql` from your project
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run**

This creates all tables, indexes, RLS policies, and the trigger for auto-creating default categories.

**For existing databases without category_type:**

See [Step 5d: Upgrading Existing Database](#step-5d-upgrading-existing-database) below for migration instructions.

## 🔧 Supabase Configuration Required

### 1. Email/Password Authentication (Already Enabled by Default)

**No action needed!** Email/password authentication is enabled by default in Supabase. Users can sign up and sign in immediately.

**Optional Settings** (in Supabase Dashboard → Authentication → Settings):
- **Enable email confirmations**: Toggle this if you want users to verify their email before signing in
- **Password requirements**: Configure minimum password length (default is 6 characters)
- **Email templates**: Customize the confirmation and password reset emails

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "FinancePro" (or your app name)
   - Authorized redirect URIs: 
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
5. Copy the **Client ID** and **Client Secret**
6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Google**
   - Enable the provider
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

### 3. Microsoft/Outlook OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**:
   - Name: "FinancePro" (or your app name)
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: 
     - Type: **Web**
     - URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
4. Click **Register**
5. Create a client secret:
   - Go to **Certificates & secrets** → **New client secret**
   - Description: "FinancePro Secret"
   - Expires: Choose your preference
   - Click **Add** and **copy the secret value immediately** (you won't see it again!)
6. Copy the **Application (client) ID** from the Overview page
7. In Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Microsoft** (or **Azure**)
   - Enable the provider
   - Paste your **Application (client) ID** and **Client Secret**
   - Click **Save**

### 4. Site URL Configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: Set to your app's URL (e.g., `http://localhost:3000` for development, or your production URL)
- **Redirect URLs**: Add your callback URLs:
  ```
  http://localhost:3000/auth/callback
  https://yourdomain.com/auth/callback
  ```

---

## 🔐 Authentication Configuration

### ✅ Code Updates Complete

All authentication code has been updated to use Supabase. The following files have been modified:

- ✅ `src/contexts/AuthContext.tsx` - Now uses Supabase auth
- ✅ `src/app/auth/page.tsx` - Real Supabase sign-in/sign-up with OAuth
- ✅ `src/lib/supabase/middleware.ts` - Handles session refresh
- ✅ `src/app/auth/callback/route.ts` - Handles OAuth callbacks
- ✅ `src/components/ProtectedRoute.tsx` - Works with Supabase auth

### 1. Email/Password Authentication (Already Enabled by Default)

**No action needed!** Email/password authentication is enabled by default in Supabase. Users can sign up and sign in immediately.

**Optional Settings** (in Supabase Dashboard → Authentication → Settings):
- **Enable email confirmations**: Toggle this if you want users to verify their email before signing in
- **Password requirements**: Configure minimum password length (default is 6 characters)
- **Email templates**: Customize the confirmation and password reset emails

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "FinancePro" (or your app name)
   - Authorized redirect URIs: 
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
5. Copy the **Client ID** and **Client Secret**
6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Google**
   - Enable the provider
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

### 3. Microsoft/Outlook OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**:
   - Name: "FinancePro" (or your app name)
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: 
     - Type: **Web**
     - URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
4. Click **Register**
5. Create a client secret:
   - Go to **Certificates & secrets** → **New client secret**
   - Description: "FinancePro Secret"
   - Expires: Choose your preference
   - Click **Add** and **copy the secret value immediately** (you won't see it again!)
6. Copy the **Application (client) ID** from the Overview page
7. In Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Microsoft** (or **Azure**)
   - Enable the provider
   - Paste your **Application (client) ID** and **Client Secret**
   - Click **Save**

### 4. Site URL Configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: Set to your app's URL (e.g., `http://localhost:3000` for development, or your production URL)
- **Redirect URLs**: Add your callback URLs:
  ```
  http://localhost:3000/auth/callback
  https://yourdomain.com/auth/callback
  ```

### 5. Database Setup: Complete Schema and Default Categories Trigger

When a new user signs up, the app automatically creates default categories for them. You need to set up the complete database schema first.

**IMPORTANT: Run these steps in order!**

#### Step 5a: Create Complete Database Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy and run the complete `supabase/db_setup.sql` file (see below for the complete script)

This creates:
- All tables (categories, budget_goals, debts, transactions)
- Category type support (income/expense)
- Debt interest period and interest start date support
- All indexes and RLS policies
- The trigger to auto-create default categories

**Complete Database Setup SQL:**

```sql
-- See supabase/db_setup.sql for the complete script
-- This includes:
-- - Categories table with category_type ('income' | 'expense')
-- - Budget goals, debts, and transactions tables
-- - All RLS policies
-- - Auto-create default categories trigger
```

**Or run the complete setup:**

1. Open `supabase/db_setup.sql` in your project
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**

#### Step 5b: Verify Database Setup

After running the setup, verify:

1. Check that tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('categories', 'budget_goals', 'debts', 'transactions');
   ```

2. Check that categories table has category_type column:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'categories';
   ```

3. Verify the trigger exists:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_user_created';
   ```

4. Test user creation:
   - Create a new test account in your app
   - Go to Supabase Dashboard → **Table Editor** → **categories**
   - You should see 11 default categories for that new user (9 expense, 2 income)

#### Step 5c: Understanding Category Types

The database now supports category types:

- **Expense Categories**: Used for budget goals and expense transactions
  - Examples: Groceries, Rent, Food/Dining, Coffee, Transport
- **Income Categories**: Used for income transactions only
  - Examples: Part-time Job, Scholarship

**Important Notes:**
- The `db_setup.sql` script includes the trigger setup automatically
- Categories are typed as 'income' or 'expense'
- Budget goals are only for expense categories (enforced in application logic)
- The goals page only shows expense categories
- The trigger function uses `SECURITY DEFINER` to bypass RLS when creating categories
- Default categories include both income and expense types

#### Step 5d: Upgrading Existing Database

If you already have a database with tables but no category_type column:

1. Run the migration script `supabase/migrations/add_category_type.sql`
   - This safely adds the category_type column to existing tables
   - Updates existing categories based on name patterns
   - Adds the index for better query performance

2. After migration, verify:
   ```sql
   SELECT name, category_type FROM categories LIMIT 10;
   ```

#### Step 5e: Adding Debt Interest Fields (For Existing Databases)

If you have an existing database without `interest_period` and `interest_start_date` fields:

1. Run the migration script `supabase/migrations/add_debt_interest_fields.sql`
   - This adds the `interest_period` enum type
   - Adds `interest_period` column (defaults to 'monthly')
   - Adds `interest_start_date` column (defaults to `start_date` for existing records)
   - Creates indexes for better query performance

2. After migration, verify:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'debts' 
   AND column_name IN ('interest_period', 'interest_start_date');
   ```

**Note:** Fresh installations using `db_setup.sql` already include these fields.

## 🧪 Testing

1. **Email/Password**:
   - Go to `/auth`
   - Click "Sign Up" tab
   - Enter email and password
   - Should create account and sign you in (or send confirmation email if enabled)

2. **Google OAuth**:
   - Click "Sign In with Google"
   - Should redirect to Google login
   - After authentication, redirects back to your app

3. **Microsoft/Outlook OAuth**:
   - Click "Sign In with Outlook"
   - Should redirect to Microsoft login
   - After authentication, redirects back to your app

## 📝 Important Notes

- **Email Confirmation**: By default, Supabase may require email confirmation. You can disable this in Authentication → Settings if you want immediate sign-in after registration.

- **OAuth Redirect URIs**: Make sure the redirect URI in Google/Azure matches exactly:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
  (Not your Next.js app URL!)

- **Environment Variables**: Make sure your `.env.local` has:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

## 🐛 Troubleshooting

### Common OAuth Errors

#### ❌ Google Error: `redirect_uri_mismatch` or `Access blocked: This app's request is invalid`
**Problem**: The redirect URI in Google Cloud Console doesn't match what Supabase is using.

**Solution**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", make sure you have:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. **Remove any localhost URLs** - they won't work with Supabase OAuth
5. Save and wait a few minutes for changes to propagate

#### ❌ Microsoft Error: `unauthorized_client: The client does not exist or is not enabled for consumers`
**Problem**: Either the redirect URI is wrong OR the app isn't configured for consumer accounts.

**Solution**:
1. Go to Azure Portal → App registrations → Your app
2. Go to **Authentication**
3. Under "Redirect URIs", make sure you have:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Under "Supported account types", select:
   - ✅ **Accounts in any organizational directory and personal Microsoft accounts**
   - (This allows consumer/personal Microsoft accounts)
5. Save changes

### Database Issues

#### ❌ Error: "relation 'categories' does not exist" or "current transaction is aborted"

**Problem**: The database tables haven't been created yet, or a previous migration failed.

**Solution:**
1. **First, remove any broken triggers:**
   ```sql
   DROP TRIGGER IF EXISTS on_user_created ON auth.users;
   DROP FUNCTION IF EXISTS handle_new_user();
   ```

2. **Then run the complete database setup:**
   - Open `supabase/db_setup.sql`
   - Copy the entire file
   - Run it in Supabase SQL Editor

3. **Verify tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('categories', 'budget_goals', 'debts', 'transactions');
   ```

4. **If you have existing data, use the migration instead:**
   - Run `supabase/migrations/add_category_type.sql` which is safer for existing databases

#### ❌ Error: "category_type column does not exist"

**Problem**: You're running code that expects category_type, but your database doesn't have it yet.

**Solution:**
1. Run the migration script: `supabase/migrations/add_category_type.sql`
2. This adds the category_type column to existing tables safely

#### ❌ User registration fails with database error

**Problem**: The trigger is trying to create categories, but something is wrong.

**Solution:**
1. Check if tables exist (see above)
2. Temporarily disable the trigger:
   ```sql
   DROP TRIGGER IF EXISTS on_user_created ON auth.users;
   ```
3. Fix the database setup (run `db_setup.sql`)
4. Re-enable the trigger (it's included in `db_setup.sql`)

### Other Issues

- **OAuth not working**: Check that redirect URIs match exactly in both Supabase and OAuth provider settings
- **Email not sending**: Check Supabase Dashboard → Authentication → Settings for email configuration
- **Session not persisting**: Make sure middleware is running (check `src/middleware.ts`)
- **Categories not showing on goals page**: Make sure you're fetching with `?type=expense` query parameter

### ⚠️ CRITICAL: Redirect URI Must Be Supabase URL

**DO NOT USE**: `http://localhost:3000/auth/callback`  
**MUST USE**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

The OAuth flow works like this:
1. User clicks "Sign in with Google/Microsoft"
2. User is redirected to Google/Microsoft
3. After authentication, Google/Microsoft redirects to **Supabase** (not your app)
4. Supabase processes the OAuth callback
5. Supabase then redirects to your Next.js app at `/auth/callback`

