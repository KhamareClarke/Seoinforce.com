# Custom Authentication Setup Guide

This application now uses **custom authentication with SMTP email verification** instead of Supabase Auth.

## ✅ What's Changed

- ✅ Custom user authentication (no Supabase Auth dependency)
- ✅ SMTP email verification using Gmail
- ✅ JWT-based session management
- ✅ Password hashing with bcrypt
- ✅ Email verification links sent via SMTP

## 📋 Setup Steps

### 1. Database Setup

Run the custom authentication schema in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/custom_auth_schema.sql`
5. Paste and click **Run**

This will create:
- `users` table (replaces Supabase auth.users)
- Updated `profiles` table
- Triggers and functions for auto-creating profiles

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (SMTP)
EMAIL_USER=khamareclarke@gmail.com
EMAIL_PASS=ovga hgzy rltc ifyh
AUDIT_EMAIL=khamareclarke@gmail.com
BOOKING_EMAIL=khamareclarke@gmail.com

# JWT Secret (IMPORTANT: Change this to a random string in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App URL (for email verification links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, use: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**⚠️ Important:** Generate a secure JWT_SECRET for production:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install Dependencies

The required packages are already installed:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `nodemailer` - SMTP email sending

### 4. Restart Development Server

```bash
npm run dev
```

## 🔐 How It Works

### Sign Up Flow

1. User fills out sign-up form
2. Password is hashed with bcrypt
3. User record is created in `users` table (unverified)
4. Verification email is sent via SMTP
5. User clicks link in email
6. Email is verified, user can now sign in

### Sign In Flow

1. User enters email and password
2. Password is verified against hash
3. Email verification status is checked
4. JWT token is generated and stored in cookie
5. User is redirected to dashboard

### Email Verification

- Verification links expire after 24 hours
- Links are sent via SMTP (Gmail)
- Users must verify before signing in
- Verification page: `/verify-email?token=...`

## 📧 Email Templates

Verification emails are sent using the SMTP configuration. The email includes:
- Professional HTML template
- Verification button
- Fallback link
- 24-hour expiration notice

## 🔧 API Endpoints

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/verify-email?token=...` - Verify email address

## 🛡️ Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with expiration (7 days)
- ✅ HTTP-only cookies for session storage
- ✅ Email verification required before sign-in
- ✅ Token expiration (24 hours for verification)

## 📝 Database Schema

The `users` table includes:
- `id` - UUID primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `email_verified` - Boolean verification status
- `verification_token` - Token for email verification
- `verification_token_expires` - Token expiration time
- `plan_type` - User subscription plan
- `is_admin` - Admin flag
- `is_banned` - Ban status

## 🚨 Important Notes

1. **Migration**: If you have existing users in Supabase Auth, you'll need to migrate them manually
2. **RLS Policies**: The schema includes RLS policies, but you may need to adjust them for your use case
3. **Production**: Always use a strong JWT_SECRET in production
4. **Email Service**: Currently configured for Gmail, but can be changed to other SMTP providers

## 🐛 Troubleshooting

### "Invalid email or password"
- Check if email is verified
- Verify password is correct
- Check database connection

### "Email verification failed"
- Check SMTP credentials in `.env.local`
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check email spam folder

### "Token expired"
- Verification links expire after 24 hours
- User needs to sign up again or request new verification

### Database Errors
- Ensure `custom_auth_schema.sql` has been run
- Check Supabase connection settings
- Verify table permissions

## ✅ Testing

1. Go to `/sign-up`
2. Create an account
3. Check email for verification link
4. Click verification link
5. Sign in at `/sign-in`
6. Should redirect to dashboard

## 📚 Next Steps

- [ ] Update middleware to use custom auth
- [ ] Update protected routes to use `getCurrentUser()`
- [ ] Add password reset functionality
- [ ] Add resend verification email feature
- [ ] Update admin authentication if needed
