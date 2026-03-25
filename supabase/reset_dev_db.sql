-- ============================================================
-- DEVELOPMENT ONLY: Full database reset script
-- Clears all user data respecting foreign key order.
-- Run this in the Supabase SQL Editor (Project > SQL Editor).
-- WARNING: This is irreversible. Do NOT run in production.
-- ============================================================

-- Step 1: Disable triggers temporarily to avoid cascading issues
-- (Optional – safe to remove if you want triggers to fire during delete)
SET session_replication_role = replica;

-- Step 2: Delete in dependency order (children before parents)
DELETE FROM public.transactions;
DELETE FROM public.investments;
DELETE FROM public.deposits;
DELETE FROM public.withdrawals;

-- Step 3: Remove user profiles and roles
DELETE FROM public.profiles;

-- Step 4: Re-enable triggers
SET session_replication_role = DEFAULT;

-- Step 5: Delete all auth users
-- This cascades and removes all Supabase auth sessions, refresh tokens, etc.
-- IMPORTANT: Run this last. Requires service_role key or postgres superuser.
DELETE FROM auth.users;

-- Step 6: Confirm clean state
SELECT 'transactions'  AS table_name, COUNT(*) AS remaining FROM public.transactions
UNION ALL SELECT 'investments',  COUNT(*) FROM public.investments
UNION ALL SELECT 'deposits',     COUNT(*) FROM public.deposits
UNION ALL SELECT 'withdrawals',  COUNT(*) FROM public.withdrawals
UNION ALL SELECT 'profiles',     COUNT(*) FROM public.profiles
UNION ALL SELECT 'auth.users',   COUNT(*) FROM auth.users;
