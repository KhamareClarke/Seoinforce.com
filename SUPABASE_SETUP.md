# Supabase Configuration Guide

## ⚠️ Common Sign-Up Issues & Solutions

### Issue 1: "Anonymous sign-ins are disabled"
This message appears when Supabase email confirmation is enabled. Here's how to fix it:

### Solution: Disable Email Confirmation (For Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uzdwfirklszwrsqknmvl
2. Navigate to **Authentication** → **Providers** (left sidebar)
3. Click on **Email** provider
4. Scroll down to **Email Auth Settings**
5. **Disable** "Confirm email" toggle
6. Click **Save**

Now users can sign up and sign in immediately without email confirmation.

### Issue 2: Database Schema Not Run

If you get errors about missing tables or triggers:

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**

This creates:
- All tables (profiles, projects, audits, etc.)
- The trigger that auto-creates profiles on signup
- All security policies

### Issue 3: Password Requirements

Supabase has default password requirements:
- Minimum 6 characters (we enforce this in the UI)
- For production, consider stronger requirements

### Issue 4: Email Already Exists

If you try to sign up with an existing email:
- The error message will now say "This email is already registered. Please sign in instead."
- Just use the "Sign In" button instead

## 🔧 Recommended Settings for Development

### Authentication Settings:
- ✅ Email provider: Enabled
- ❌ Email confirmation: **Disabled** (for faster testing)
- ✅ Sign up: Enabled
- ✅ Sign in: Enabled

### For Production:
- ✅ Email confirmation: **Enabled** (for security)
- ✅ Custom email templates: Configured
- ✅ Password reset: Enabled

## 🧪 Testing Sign-Up

After disabling email confirmation:

1. Go to http://localhost:3000/sign-in
2. Enter email and password (min 6 chars)
3. Click "Create Account"
4. You should be redirected to `/audit/dashboard` immediately
5. Check Supabase Dashboard → **Authentication** → **Users** to see the new user
6. Check **Table Editor** → **profiles** to see the auto-created profile

## 📋 Database Verification Checklist

After running the schema, verify these exist:

- [ ] `profiles` table
- [ ] `projects` table
- [ ] `audits` table
- [ ] `audit_issues` table
- [ ] `keywords` table
- [ ] `keyword_rankings` table
- [ ] `competitors` table
- [ ] `backlinks` table
- [ ] `local_seo` table
- [ ] `reports` table
- [ ] `api_usage` table
- [ ] Trigger: `on_auth_user_created`
- [ ] Function: `handle_new_user()`

## 🔍 Debugging Tips

### Check Browser Console
Open DevTools (F12) → Console tab to see detailed error messages

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Postgres Logs** or **API Logs**
3. Look for errors related to sign-up

### Check Network Tab
1. Open DevTools → Network tab
2. Try signing up
3. Look for failed requests to Supabase
4. Check the response for error details

### Common Error Messages:

- **"Invalid API key"**: Check `.env.local` has correct keys
- **"relation does not exist"**: Database schema not run
- **"permission denied"**: RLS policies not set up correctly
- **"email already registered"**: User exists, use sign in instead

## ✅ Quick Fix Checklist

1. ✅ `.env.local` file exists with correct Supabase credentials
2. ✅ Database schema has been run in SQL Editor
3. ✅ Email confirmation is disabled (for development)
4. ✅ Password is at least 6 characters
5. ✅ Email format is valid (contains @)
6. ✅ Dev server is running (`npm run dev`)

If all checked, sign-up should work! 🎉
