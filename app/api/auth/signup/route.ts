import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'khamareclarke@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, accountType, brandName, brandWebsite } = body;

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours

    // Validate brand account
    if (accountType === 'brand' && !brandName) {
      return NextResponse.json(
        { error: 'Brand name is required for brand accounts' },
        { status: 400 }
      );
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName || email.split('@')[0],
        account_type: accountType || 'personal',
        brand_name: accountType === 'brand' ? brandName : null,
        brand_website: accountType === 'brand' ? brandWebsite || null : null,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires.toISOString(),
      })
      .select('id, email, full_name, account_type, brand_name')
      .single();

    if (userError || !user) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Send verification email
    // Always use production URL in emails (never localhost)
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seoinforce.com';
    // If URL contains localhost, use production URL instead
    if (appUrl.includes('localhost')) {
      appUrl = 'https://seoinforce.com';
    }
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'khamareclarke@gmail.com',
      to: email,
      subject: 'Verify Your SEOInForce Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #fbbf24; background: #1f2937; padding: 20px; margin: 0; text-align: center; border-radius: 8px 8px 0 0;">
            ✉️ Verify Your Email Address
          </h2>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Hi ${fullName || email.split('@')[0]},
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Thank you for creating an account with SEOInForce! Please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #fbbf24; color: #1f2937; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">Best regards,<br><strong>SEOInForce Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent to:', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the signup if email fails, but log it
    }

    // Schedule welcome email (5 minutes delay)
    // In production, use a proper job queue. For now, we'll use a setTimeout on the server
    // Note: This is a simple approach. For production, consider using a job queue like Bull, Agenda, etc.
    setTimeout(async () => {
      try {
        // Use production URL for internal API calls (never localhost)
        let apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seoinforce.com';
        if (apiUrl.includes('localhost')) {
          apiUrl = 'https://seoinforce.com';
        }
        await fetch(`${apiUrl}/api/emails/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error('Error scheduling welcome email:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
