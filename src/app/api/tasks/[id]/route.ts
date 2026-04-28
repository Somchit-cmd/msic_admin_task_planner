import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/tasks/[id] — update an existing task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const task = await db.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const {
      taskName,
      category,
      priority,
      startDate,
      deadline,
      assignedTo,
      note,
      status,
    } = body;

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(taskName !== undefined && { taskName }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && { startDate }),
        ...(deadline !== undefined && { deadline }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(note !== undefined && { note }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] — delete a task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.task.delete({ where: { id } });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
