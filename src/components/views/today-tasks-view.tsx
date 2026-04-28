"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CheckCircle2,
  Pencil,
  Trash2,
  Undo2,
  Sun,
  User,
  Clock,
} from "lucide-react";
import { useTaskStore, type Task } from "@/store/task-store";
import { useSettingsStore } from "@/store/settings-store";
import { differenceInDays, format } from "date-fns";
import { DeleteTaskDialog } from "@/components/delete-task-dialog";
import { CompleteTaskDialog } from "@/components/complete-task-dialog";

// ─── Dynamic Badge Helpers ────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function getPriorityBadgeClass(priority: string, color: string): string {
  if (color && PRIORITY_STYLES[color]) return `border-transparent ${PRIORITY_STYLES[color]}`;
  switch (priority) {
    case "High": return "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "Medium": return "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "Low": return "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "border-transparent bg-muted text-muted-foreground";
  }
}

function getStatusBadgeClass(status: string, color: string): string {
  if (color && PRIORITY_STYLES[color]) return `border-transparent ${PRIORITY_STYLES[color]}`;
  switch (status) {
    case "Pending": return "border-transparent";
    case "In Progress": return "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "Completed": return "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "border-transparent";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDeadlineInfo(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diff = differenceInDays(deadlineDate, today);

  if (diff < 0) {
    return (
      <span className="text-destructive font-medium">
        Overdue by {Math.abs(diff)}d
      </span>
    );
  }
  if (diff === 0) {
    return <span className="text-amber-600 dark:text-amber-400 font-medium">Due today</span>;
  }
  return (
    <span className="text-muted-foreground">
      Due in {diff} day{diff !== 1 ? "s" : ""}
    </span>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  getSettingColor,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  getSettingColor: (type: string, name: string) => string;
}) {
  const isOverdue =
    task.status !== "Completed" && differenceInDays(new Date(task.deadline), new Date()) < 0;
  const priorityColor = getSettingColor("priority", task.priority);
  const statusColor = getSettingColor("status", task.status);
  const categoryColor = getSettingColor("category", task.category);

  return (
    <Card className={`transition-shadow hover:shadow-md ${isOverdue ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
            {/* Task name + badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-medium text-sm sm:text-base truncate">{task.taskName}</h3>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={cn("text-[10px] px-1.5 py-0 sm:text-xs", getPriorityBadgeClass(task.category, categoryColor))}>{task.category}</Badge>
              <Badge className={cn("text-[10px] px-1.5 py-0 sm:text-xs", getPriorityBadgeClass(task.priority, priorityColor))}>{task.priority}</Badge>
              <Badge className={cn("text-[10px] px-1.5 py-0 sm:text-xs", getStatusBadgeClass(task.status, statusColor))}>{task.status}</Badge>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sm:hidden">{format(new Date(task.deadline), "MMM d")}</span>
                <span className="hidden sm:inline">{format(new Date(task.deadline), "MMM d, yyyy")}</span>
              </span>
              {task.assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {task.assignedTo}
                </span>
              )}
              <span>{getDeadlineInfo(task.deadline)}</span>
            </div>

            {/* Note */}
            {task.note && (
              <p className="text-xs text-muted-foreground line-clamp-2 sm:text-sm">
                {task.note}
              </p>
            )}
          </div>

          {/* Actions — 44px min touch target */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg sm:h-8 sm:w-8",
                task.status === "Completed"
                  ? "text-amber-600 hover:text-amber-600"
                  : "text-emerald-600 hover:text-emerald-600"
              )}
              onClick={() => onComplete(task)}
              aria-label={task.status === "Completed" ? "Reopen task" : "Mark as complete"}
            >
              {task.status === "Completed" ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span className="sr-only">{task.status === "Completed" ? "Reopen task" : "Mark as complete"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg sm:h-8 sm:w-8"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit task</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-destructive hover:text-destructive sm:h-8 sm:w-8"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete task</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TodayTasksView() {
  const getTodayTasks = useTaskStore((s) => s.getTodayTasks);
  const setEditingTask = useTaskStore((s) => s.setEditingTask);
  const setIsDialogOpen = useTaskStore((s) => s.setIsDialogOpen);

  const { fetchSettings, initialized, getSettingColor } = useSettingsStore();

  useEffect(() => {
    if (!initialized) fetchSettings();
  }, [initialized, fetchSettings]);

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const todayTasks = getTodayTasks();
  const formattedDateShort = format(new Date(), "EEE, MMM d");
  const formattedDateLong = format(new Date(), "EEEE, MMMM d, yyyy");

  function handleEdit(task: Task) {
    setEditingTask(task);
    setIsDialogOpen(true);
  }

  function handleDelete(task: Task) {
    setDeleteTarget(task);
    setDeleteDialogOpen(true);
  }

  const handleComplete = useCallback((task: Task) => {
    setCompleteTarget(task);
    setCompleteDialogOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0">
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold sm:text-xl truncate">Today&apos;s Tasks</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              <span className="sm:hidden">{formattedDateShort}</span>
              <span className="hidden sm:inline">{formattedDateLong}</span>
              &nbsp;&mdash;&nbsp;{todayTasks.length} task{todayTasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      {todayTasks.length > 0 ? (
        <div className="space-y-2.5 sm:space-y-3">
          {todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onComplete={handleComplete}
              getSettingColor={getSettingColor}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-6">
            <div className="p-3 rounded-full bg-muted mb-4">
              <CalendarCheck className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-base sm:text-lg mb-1">No tasks for today</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You don&apos;t have any tasks scheduled for today. Tap &quot;Add&quot; to create one.
            </p>
          </CardContent>
        </Card>
      )}

      <DeleteTaskDialog
        task={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <CompleteTaskDialog
        task={completeTarget}
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      />
    </div>
  );
}
