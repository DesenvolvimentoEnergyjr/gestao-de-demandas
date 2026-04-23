import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/session
 * Sets a session cookie after successful Firebase authentication.
 * The cookie stores the Firebase ID token for middleware verification.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ status: 'ok' });

    response.cookies.set('__session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' });

  response.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Immediately expires the cookie
    path: '/',
  });

  return response;
}
