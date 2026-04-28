import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tasks — fetch all tasks
export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: { dateCreated: "desc" },
    });
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
        dateCreated: new Date().toISOString().split("T")[0],
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
