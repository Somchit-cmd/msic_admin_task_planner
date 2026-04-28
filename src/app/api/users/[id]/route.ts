import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ── PUT /api/users/[id] — Update user (admin only) ──────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { username, name, role, status, password } = body;

    // Check user exists
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deactivating themselves
    if (id === currentUser.userId && status === 'inactive') {
      return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
    }

    // Prevent removing own admin role
    if (id === currentUser.userId && role === 'user') {
      return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 });
    }

    // Check username uniqueness if changing (case-insensitive)
    if (username && username.toLowerCase() !== existing.username.toLowerCase()) {
      const duplicate = await db.user.findUnique({ where: { username: username.toLowerCase() } });
      if (duplicate) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username.toLowerCase();
    if (name !== undefined) updateData.name = name || null;
    if (role !== undefined) updateData.role = role === 'admin' ? 'admin' : 'user';
    if (status !== undefined) updateData.status = status === 'active' ? 'active' : 'inactive';

    if (password) {
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return NextResponse.json({ error: 'Password must be at least 8 characters, with 1 uppercase letter and 1 number' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/users/[id] — Delete user (admin only) ────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === currentUser.userId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
