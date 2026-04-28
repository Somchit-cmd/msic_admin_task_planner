import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings to seed
const DEFAULT_SETTINGS = [
  // ── Categories ──
  { type: 'category', name: 'Development', color: '', sortOrder: 0 },
  { type: 'category', name: 'Design', color: '', sortOrder: 0 },
  { type: 'category', name: 'Marketing', color: '', sortOrder: 0 },
  { type: 'category', name: 'Research', color: '', sortOrder: 0 },
  { type: 'category', name: 'Testing', color: '', sortOrder: 0 },
  { type: 'category', name: 'Documentation', color: '', sortOrder: 0 },
  { type: 'category', name: 'Operations', color: '', sortOrder: 0 },

  // ── Priorities ──
  { type: 'priority', name: 'Low', color: 'green', sortOrder: 1 },
  { type: 'priority', name: 'Medium', color: 'amber', sortOrder: 2 },
  { type: 'priority', name: 'High', color: 'red', sortOrder: 3 },

  // ── Statuses ──
  { type: 'status', name: 'Pending', color: 'gray', sortOrder: 1 },
  { type: 'status', name: 'In Progress', color: 'blue', sortOrder: 2 },
  { type: 'status', name: 'Completed', color: 'green', sortOrder: 3 },
];

// POST /api/settings/seed — Seed default settings (idempotent)
export async function POST() {
  try {
    // Group defaults by type
    const types = ['category', 'priority', 'status'] as const;
    const stats: Record<string, number> = { created: 0, skipped: 0 };

    for (const type of types) {
      // Check if any settings of this type already exist
      const existingCount = await db.systemSetting.count({ where: { type } });

      if (existingCount > 0) {
        // Skip seeding for this type — already has data
        const defaultsForType = DEFAULT_SETTINGS.filter(s => s.type === type);
        stats.skipped += defaultsForType.length;
        continue;
      }

      // No settings of this type exist — seed them
      const defaultsForType = DEFAULT_SETTINGS.filter(s => s.type === type);
      await db.systemSetting.createMany({ data: defaultsForType });
      stats.created += defaultsForType.length;
    }

    return NextResponse.json({
      message: `Seeding complete. Created ${stats.created}, skipped ${stats.skipped} (already exist).`,
      created: stats.created,
      skipped: stats.skipped,
    });
  } catch (error) {
    console.error('POST /api/settings/seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed settings' },
      { status: 500 }
    );
  }
}
