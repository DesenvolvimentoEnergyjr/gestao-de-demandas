import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple check for presence of a potential session cookie or just let the client handle it 
  // if we don't have a reliable way to check Firebase server-side without Firebase Admin.
  // For the sake of this scaffold, we'll assume the client-side redirection in layout.tsx 
  // is the primary guard, but we add a placeholder check here for future session cookies.
  
  // const session = request.cookies.get('session');
  // if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
  //   return NextResponse.redirect(new URL('/auth', request.url));
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
