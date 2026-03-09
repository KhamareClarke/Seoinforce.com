-- Create admin user directly (no sign-up required)
-- Run this in Supabase SQL Editor.

-- Enable bcrypt-style password hashing in PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Replace 'ChangeMe123' with your desired admin password before running
INSERT INTO public.users (
  email,
  password_hash,
  full_name,
  email_verified,
  is_admin
)
VALUES (
  'admin@seoinforce.com',
  crypt('admin123', gen_salt('bf')),
  'Admin',
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  email_verified = TRUE,
  is_admin = TRUE,
  updated_at = NOW();

-- Verify
SELECT id, email, full_name, email_verified, is_admin, created_at
FROM public.users
WHERE email = 'admin@seoinforce.com';
