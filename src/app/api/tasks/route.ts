import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/tasks — fetch all tasks
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tasks = await db.task.findMany();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks — create a new task
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      taskName,
      category,
      priority = "Medium",
      startDate,
      deadline,
      assignedTo = "",
      note = "",
      status = "Pending",
    } = body;

    // Validate required fields
    if (!taskName || !category || !startDate || !deadline) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: taskName, category, startDate, deadline",
        },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        taskName,
        category,
        priority,
        startDate,
        deadline,
        assignedTo,
        note,
        status,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
