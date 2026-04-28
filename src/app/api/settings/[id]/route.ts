import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// ── PUT /api/settings/[id] — Update a setting (admin only) ─────────────────────

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
    const { name, color, sortOrder, isActive } = body;

    // Check setting exists
    const existing = await db.systemSetting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // If name is being changed, check for uniqueness within the same type
    if (name !== undefined && name.trim() !== existing.name) {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }

      const duplicate = await db.systemSetting.findUnique({
        where: {
          type_name: { type: existing.type, name: trimmedName },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `A ${existing.type} setting with name "${trimmedName}" already exists` },
          { status: 409 }
        );
      }
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = typeof color === 'string' ? color.trim() : '';
    if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : 0;
    if (isActive !== undefined) updateData.isActive = typeof isActive === 'boolean' ? isActive : existing.isActive;

    const updated = await db.systemSetting.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/settings/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/settings/[id] — Delete a setting (admin only) ──────────────────

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

    // Check setting exists
    const existing = await db.systemSetting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Check if any task is using this setting value
    // Map the setting type to the corresponding Task field
    const fieldMap: Record<string, string> = {
      category: 'category',
      priority: 'priority',
      status: 'status',
    };

    const taskField = fieldMap[existing.type];
    if (taskField) {
      const taskUsingSetting = await db.task.findFirst({
        where: { [taskField]: existing.name },
      });

      if (taskUsingSetting) {
        return NextResponse.json(
          {
            error: `Cannot delete this setting because it is being used by ${
              existing.type === 'category' ? 'categories' :
              existing.type === 'priority' ? 'priorities' :
              'statuses'
            } on existing tasks`,
            inUse: true,
          },
          { status: 409 }
        );
      }
    }

    await db.systemSetting.delete({ where: { id } });

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/settings/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
