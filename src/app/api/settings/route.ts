import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const VALID_TYPES = ['category', 'priority', 'status'] as const;

// ── GET /api/settings — Fetch settings (public, used by task forms) ────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type && !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const settings = await db.systemSetting.findMany({
      where: {
        ...(type ? { type } : {}),
        isActive: true,
      },
      orderBy: [
        { sortOrder: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// ── POST /api/settings — Create a new setting (admin only) ─────────────────────

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, name, color, sortOrder } = body;

    // Validate type
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for duplicate (type + name must be unique)
    const existing = await db.systemSetting.findUnique({
      where: { type_name: { type, name: trimmedName } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A ${type} setting with name "${trimmedName}" already exists` },
        { status: 409 }
      );
    }

    const setting = await db.systemSetting.create({
      data: {
        type,
        name: trimmedName,
        color: typeof color === 'string' ? color.trim() : '',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}
