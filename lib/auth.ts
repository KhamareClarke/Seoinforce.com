import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSupabaseServerClient } from './supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  email_verified: boolean;
  plan_type: string;
  is_admin: boolean;
  account_type?: 'personal' | 'brand';
  agency_id?: string | null;
  brand_name?: string | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    // Get token from cookie in request
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database
    const supabase = createSupabaseServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, email_verified, plan_type, is_admin, account_type, agency_id, brand_name')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      email_verified: user.email_verified,
      plan_type: user.plan_type,
      is_admin: user.is_admin,
      account_type: user.account_type || 'personal',
      agency_id: user.agency_id ?? null,
      brand_name: user.brand_name ?? null,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/** Shared cookie domain so www and apex both receive auth-token. */
function getAuthCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  try {
    const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://seoinforce.com').trim();
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname;
    if (host === 'seoinforce.com' || host.endsWith('.seoinforce.com')) {
      return '.seoinforce.com';
    }
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export function getAuthCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  const domain = getAuthCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
    ...(domain ? { domain } : {}),
  };
}

// Set auth cookie (used in API routes)
export function setAuthCookie(token: string, response: NextResponse) {
  response.cookies.set('auth-token', token, getAuthCookieOptions());
}

// Clear auth cookie (used in API routes)
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('auth-token', '', { ...getAuthCookieOptions(0), maxAge: 0 });
}

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
