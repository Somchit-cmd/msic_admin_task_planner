import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

// ── POST /api/auth/seed-admin — Create default admin if none exists ───────────

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 });
    }

    const existing = await db.user.findFirst({ where: { role: 'admin' } });
    if (existing) {
      return NextResponse.json({
        message: 'Admin already exists',
        admin: { id: existing.id, username: existing.username, name: existing.name, role: existing.role },
      });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
      },
    });

    return NextResponse.json({
      message: 'Admin account created',
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
    }, { status: 201 });
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET /api/auth/seed-admin — Check if admin exists ─────────────────────────

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 });
    }

    const admin = await db.user.findFirst({ where: { role: 'admin' } });
    return NextResponse.json({ exists: !!admin, admin: admin ? { username: admin.username, name: admin.name } : null });
  } catch (error) {
    console.error('Check admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
