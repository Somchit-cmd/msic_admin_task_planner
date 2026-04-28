import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ── GET /api/users — List all users (admin only) ─────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Non-admin users can only list active non-admin users (for task assignment)
    if (currentUser.role !== 'admin') {
      const users = await db.user.findMany({
        where: { role: 'user', status: 'active' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, name: true, role: true, status: true },
      });
      return NextResponse.json(users);
    }

    // Admin: full filtering support
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await db.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/users — Create user (admin only) ──────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
        role: role === 'admin' ? 'admin' : 'user',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
