import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionUser {
  userId: string;
  username: string;
  name: string | null;
  role: string;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

const COOKIE_NAME = 'auth_session';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (default)
const REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)
const SESSION_MAX_AGE = Math.floor(SESSION_DURATION / 1000); // seconds
const REMEMBER_MAX_AGE = Math.floor(REMEMBER_DURATION / 1000); // seconds

function getCookieOptions(remember = false, expiresAt?: Date) {
  const maxAge = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    : remember ? REMEMBER_MAX_AGE : SESSION_MAX_AGE;

  const isSecure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

function setAuthCookie(response: NextResponse, token: string, remember: boolean, expiresAt: Date) {
  const options = getCookieOptions(remember, expiresAt);
  response.cookies.set(COOKIE_NAME, token, options);
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function getTokenFromRequest(req: NextRequest): string | null {
  // Read from httpOnly cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  return null;
}

// ─── Database-backed session management ─────────────────────────────────────

async function cleanExpiredSessions() {
  try {
    await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {
    // Silently ignore cleanup errors
  }
}

export async function getSession(token: string): Promise<{ user: SessionUser; expiresAt: number } | null> {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, username: true, name: true, role: true } } },
  });

  if (!session) return null;

  // Check if expired
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    user: {
      userId: session.user.id,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role,
    },
    expiresAt: session.expiresAt.getTime(),
  };
}

export async function invalidateSession(token: string) {
  await db.session.deleteMany({ where: { token } }).catch(() => {});
}

export async function createSession(
  user: { id: string; username: string; name: string | null; role: string },
  remember = false
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_DURATION : SESSION_DURATION));

  await db.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Clean up old expired sessions in the background
  cleanExpiredSessions();

  return { token, expiresAt };
}

// ── Helper: extract user from request (reads cookie automatically) ────────────

export async function getUserFromRequest(req: NextRequest): Promise<{ userId: string; username: string; name: string | null; role: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return {
    userId: session.user.userId,
    username: session.user.username,
    name: session.user.name,
    role: session.user.role,
  };
}

// ── REGISTER ──────────────────────────────────────────────────────────────────

export async function POST_register(req: NextRequest) {
  try {
    const { username, password, name, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters, with 1 uppercase letter and 1 number' }, { status: 400 });
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters, with 1 uppercase letter and 1 number' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();
    const existing = await db.user.findUnique({ where: { username: normalizedUsername } });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        name: name || null,
        role: 'user',
      },
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export async function POST_login(req: NextRequest) {
  try {
    const { username, password, rememberMe } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is deactivated. Contact your administrator.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const doRemember = rememberMe === true;
    const { token, expiresAt } = await createSession(user, doRemember);

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });

    setAuthCookie(response, token, doRemember, expiresAt);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── SESSION CHECK ─────────────────────────────────────────────────────────────

export async function GET_session(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      // Clear invalid cookie
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user.userId,
        username: session.user.username,
        name: session.user.name,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────

export async function POST_logout(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      await invalidateSession(token);
    }
    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
