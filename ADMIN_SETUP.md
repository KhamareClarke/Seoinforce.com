# Admin Panel Setup Guide

## Overview
The admin panel provides comprehensive management tools for:
- User management (view, ban/unban, update credits, see subscriptions)
- Audit management
- API usage tracking
- Error logs monitoring
- System statistics

## Database Setup

### 1. Run the Migration
Execute the SQL migration script in your Supabase SQL editor:

```sql
-- See supabase/migrations/add_admin_features.sql
```

Or run the updated schema:
```sql
-- See supabase/schema.sql (updated with admin features)
```

### 2. Make a User Admin
To make yourself (or another user) an admin, run this SQL in Supabase:

```sql
-- Replace 'your-email@example.com' with the actual user email
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

Or use the admin panel API (if you already have admin access):
```javascript
PATCH /api/admin/users
{
  "userId": "user-uuid",
  "action": "update",
  "is_admin": true
}
```

## Accessing the Admin Panel

1. Navigate to `/admin` in your browser
2. The system will check if you have admin privileges
3. If not admin, you'll be redirected to the dashboard
4. If admin, you'll see the full admin panel

## Features

### Dashboard Tab
- Overview statistics (users, audits, API usage, errors)
- Subscription breakdown (Free, Starter, Growth, Empire)
- Recent subscriptions (last 30 days)

### Users Tab
- View all users with search functionality
- See user subscriptions (which plan they're on)
- Edit user API credits
- Ban/unban users with reason
- View user status and join date

### Audits Tab
- View all audits across all users
- See audit status, scores, and dates
- Delete audits if needed

### API Usage Tab
- View API usage statistics (last 30 days)
- See usage by API type
- Top users by API usage
- Total credits consumed

### Error Logs Tab
- View all system errors
- Filter by severity (critical, error, warning, info)
- Mark errors as resolved/unresolved
- View stack traces
- See which user/endpoint caused the error

## Security

- All admin routes check for `is_admin = TRUE` in the profiles table
- Row Level Security (RLS) policies ensure only admins can view all data
- Admin access is verified on every API request
- Non-admin users are automatically redirected

## Error Logging

To log errors from your application, use the error logger utility:

```typescript
import { logError } from '@/lib/utils/error-logger';

await logError({
  errorType: 'API_ERROR',
  errorMessage: 'Failed to process request',
  errorStack: error.stack,
  endpoint: '/api/audit',
  severity: 'error',
});
```

## Banning Users

When a user is banned:
- `is_banned` is set to `true`
- `banned_at` timestamp is recorded
- `banned_reason` stores the reason
- Banned users should be blocked from using the API (add this check to your API routes)

## Notes

- The admin panel is fully responsive
- All data is paginated for performance
- Search functionality is available for users
- Statistics update in real-time when you click refresh