import { NextResponse, type NextRequest } from 'next/server';
import { verifyTokenEdge } from '../auth-edge';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Get auth token from cookie (verify with jose — jsonwebtoken does not run on Edge)
  const token = request.cookies.get('auth-token')?.value;
  let user = null;

  if (token) {
    user = await verifyTokenEdge(token);
  }

  // Allow access to login pages and public routes without authentication
  const publicPaths = [
    '/sign-in',
    '/sign-up',
    '/verify-email',
    '/admin/login',
    '/api/auth',
    '/',
    '/blog',
    '/faq',
    '/features',
    '/pricing',
    '/products',
    '/support',
  ];
  
  const isPublicPath = publicPaths.some((path) => {
    if (path === '/') return request.nextUrl.pathname === '/';
    return (
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
    );
  });

  // Protect audit, admin, and create-project routes
  if (
    !user &&
    !isPublicPath &&
    (request.nextUrl.pathname.startsWith('/audit') || 
     request.nextUrl.pathname.startsWith('/admin') ||
     request.nextUrl.pathname.startsWith('/create-project'))
  ) {
    // No user, redirect to appropriate login page
    const url = request.nextUrl.clone();
    // If accessing admin routes, redirect to admin login, otherwise regular sign-in
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
      url.pathname = '/admin/login';
    } else if (request.nextUrl.pathname.startsWith('/audit') || request.nextUrl.pathname.startsWith('/create-project')) {
      url.pathname = '/sign-in';
    } else {
      // For other admin routes, redirect to admin login
      url.pathname = '/admin/login';
    }
    return NextResponse.redirect(url);
  }

  return response;
}
