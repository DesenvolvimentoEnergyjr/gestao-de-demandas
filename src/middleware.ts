import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/auth'];

// Static/asset paths that should be ignored by middleware
const IGNORED_PREFIXES = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/logo-energy.svg',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('__session')?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // ─── Not authenticated: redirect to /auth ───
  if (!sessionCookie && !isPublicRoute) {
    const authUrl = new URL('/auth', request.url);
    // Preserve the original destination so we can redirect back after login
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  // ─── Authenticated: prevent accessing /auth (redirect to kanban) ───
  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/kanban', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};