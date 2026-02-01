-- Grant Admin Access to a User
-- Quick script to grant admin access

UPDATE public.users 
SET 
  is_admin = TRUE,
  email_verified = TRUE
WHERE email = 'clarkekhamare@gmail.com';

-- Verify the update
SELECT id, email, full_name, is_admin, plan_type, email_verified
FROM public.users
WHERE email = 'clarkekhamare@gmail.com';
