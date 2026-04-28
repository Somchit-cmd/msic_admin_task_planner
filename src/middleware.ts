import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes that don't need authentication
  const publicApiPaths = ['/api/auth/login', '/api/auth/session'];
  const isPublicApi = publicApiPaths.some(p => pathname.startsWith(p));

  if (pathname.startsWith('/api/')) {
    if (isPublicApi) {
      return NextResponse.next();
    }
    // All other /api/ routes require the auth cookie
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
