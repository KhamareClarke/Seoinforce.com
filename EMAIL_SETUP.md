# Email Configuration Setup

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
AUDIT_EMAIL=contact@seoforce.com
BOOKING_EMAIL=contact@seoforce.com
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS` (not your regular Gmail password)

## Alternative Email Services

### SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
AUDIT_EMAIL=contact@seoforce.com
BOOKING_EMAIL=contact@seoforce.com
```

### Mailgun
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
AUDIT_EMAIL=contact@seoforce.com
BOOKING_EMAIL=contact@seoforce.com
```

### AWS SES
```env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AUDIT_EMAIL=contact@seoforce.com
BOOKING_EMAIL=contact@seoforce.com
```

## Testing Email Functionality

1. Set up your environment variables
2. Start the development server: `npm run dev`
3. Open the chat assistant
4. Request a free audit or book a consultation
5. Fill out the form
6. Check your email for the notification

## Email Templates

The system sends two types of emails:

### Audit Request Email
- Sent to `AUDIT_EMAIL` when someone requests a free SEO audit
- Includes: Name, Email, Phone, Domain, Timestamp
- Professional HTML template with action buttons

### Booking Request Email
- Sent to `BOOKING_EMAIL` when someone books a consultation
- Includes: Name, Email, Phone, Timestamp
- Professional HTML template with action buttons

## Troubleshooting

### Common Issues

1. **"Invalid login" error**: Make sure you're using an App Password, not your regular Gmail password
2. **"Less secure app" error**: Enable 2FA and use App Passwords instead
3. **SMTP timeout**: Check your internet connection and firewall settings
4. **Rate limiting**: Gmail has daily sending limits for free accounts

### Debug Mode

To see detailed email logs, check the browser console and server logs when testing.

## Production Considerations

1. **Use a dedicated email service** like SendGrid or Mailgun for production
2. **Set up proper error handling** and retry logic
3. **Implement rate limiting** to prevent spam
4. **Add email templates** management system
5. **Set up monitoring** for email delivery failures
