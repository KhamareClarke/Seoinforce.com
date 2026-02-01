-- Setup Admin User Script
-- This script helps you set up an admin user for clarkekhamare@gmail.com

-- Step 1: Check if the user exists
SELECT id, email, full_name, email_verified, is_admin, is_banned, created_at
FROM public.users
WHERE email = 'clarkekhamare@gmail.com';

-- Step 2: If user exists, grant admin access and verify email
-- This will:
-- - Set is_admin = TRUE (grants admin access)
-- - Set email_verified = TRUE (allows login without email verification)
UPDATE public.users 
SET 
  is_admin = TRUE,
  email_verified = TRUE  -- Skip email verification requirement
WHERE email = 'clarkekhamare@gmail.com';

-- Step 3: Verify the update
SELECT id, email, full_name, email_verified, is_admin, plan_type, is_banned
FROM public.users
WHERE email = 'clarkekhamare@gmail.com';

-- ============================================
-- IMPORTANT: If you get "Invalid email or password"
-- ============================================
-- 
-- Option A: If the user DOES NOT exist yet:
--   1. Go to http://localhost:3000/sign-up
--   2. Create an account with email: admin@seoinforce.com
--   3. Use any password (remember it!)
--   4. Then run this SQL script again to grant admin access
--
-- Option B: If the user EXISTS but password is wrong:
--   You need to reset the password. Currently, there's no password reset
--   feature, so you may need to:
--   1. Delete the user and recreate it, OR
--   2. Wait for password reset feature to be implemented
--
-- Option C: If email is not verified:
--   The UPDATE above sets email_verified = TRUE, so this should be fixed
--   after running the script.
