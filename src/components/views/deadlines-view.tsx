"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil,
  Trash2,
  Clock,
  CalendarCheck,
  User,
  AlertTriangle,
} from "lucide-react";
import { useTaskStore, type Task } from "@/store/task-store";
import { useSettingsStore } from "@/store/settings-store";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { DeleteTaskDialog } from "@/components/delete-task-dialog";

// ─── Dynamic Badge Helpers ────────────────────────────────────────────────────

const COLOR_STYLES: Record<string, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function getBadgeClass(color: string, fallback?: string): string {
  if (color && COLOR_STYLES[color]) return `border-transparent ${COLOR_STYLES[color]}`;
  return fallback ?? "border-transparent bg-muted text-muted-foreground";
}

// ─── Countdown Helpers ────────────────────────────────────────────────────────

function getCountdownLabel(deadline: string): { text: string; className: string } {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  const hoursLeft = differenceInHours(deadlineDate, now);
  const daysLeft = differenceInDays(deadlineDate, now);

  if (hoursLeft < 0) {
    const overdueDays = Math.abs(differenceInDays(new Date(deadline), new Date()));
    return {
      text: `Overdue ${overdueDays}d`,
      className: "text-destructive font-semibold",
    };
  }
  if (daysLeft === 0 && hoursLeft >= 0) {
    return {
      text: hoursLeft <= 12 ? `${hoursLeft}h left` : "Due today",
      className: "text-amber-600 dark:text-amber-400 font-medium",
    };
  }
  if (daysLeft === 1) {
    return { text: "Tomorrow", className: "text-amber-600 dark:text-amber-400 font-medium" };
  }
  if (daysLeft <= 3) {
    return { text: `${daysLeft}d left`, className: "text-amber-600 dark:text-amber-400 font-medium" };
  }
  return { text: `${daysLeft}d left`, className: "text-muted-foreground" };
}

// ─── Compact Task Card ────────────────────────────────────────────────────────

function CompactTaskCard({
  task,
  isOverdue,
  onEdit,
  onDelete,
  getSettingColor,
}: {
  task: Task;
  isOverdue?: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  getSettingColor: (type: string, name: string) => string;
}) {
  const priorityColor = getSettingColor("priority", task.priority);
  const statusColor = getSettingColor("status", task.status);
  const categoryColor = getSettingColor("category", task.category);
  const countdown = getCountdownLabel(task.deadline);

  return (
    <div
      className={cn(
        "group rounded-xl border p-3 transition-all min-w-0 overflow-hidden",
        isOverdue
          ? "bg-red-50/80 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/40"
          : "hover:border-primary/20 hover:shadow-sm bg-card"
      )}
    >
      {/* Top row: name + actions */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight truncate min-w-0">{task.taskName}</h4>
        <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <Badge className={cn("text-[10px] px-1.5 py-0 h-5", getBadgeClass(categoryColor))}>
          {task.category}
        </Badge>
        <Badge className={cn("text-[10px] px-1.5 py-0 h-5", getBadgeClass(priorityColor))}>
          {task.priority}
        </Badge>
        <Badge className={cn("text-[10px] px-1.5 py-0 h-5", getBadgeClass(statusColor))}>
          {task.status}
        </Badge>
      </div>

      {/* Meta row: date, countdown, assignee */}
      <div className="flex items-center justify-between mt-2 gap-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            <span className="sm:hidden">{format(new Date(task.deadline), "MMM d")}</span>
            <span className="hidden sm:inline">{format(new Date(task.deadline), "MMM d, yyyy")}</span>
          </span>
          {task.assignedTo && (
            <span className="hidden sm:flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[100px] lg:max-w-[140px]">{task.assignedTo}</span>
            </span>
          )}
        </div>
        <span className={cn("shrink-0 text-[11px] font-medium", countdown.className)}>
          {countdown.text}
        </span>
      </div>

      {/* Mobile assignee row */}
      {task.assignedTo && (
        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground sm:hidden">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.assignedTo}</span>
        </div>
      )}

      {/* Note preview */}
      {task.note && (
        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1 leading-relaxed">
          {task.note}
        </p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">{description}</p>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function DeadlinesView() {
  const tasks = useTaskStore((s) => s.tasks);
  const getDeadlineTasks = useTaskStore((s) => s.getDeadlineTasks);
  const getOverdueTasks = useTaskStore((s) => s.getOverdueTasks);
  const setEditingTask = useTaskStore((s) => s.setEditingTask);
  const setIsDialogOpen = useTaskStore((s) => s.setIsDialogOpen);

  const { fetchSettings, initialized, getSettingColor } = useSettingsStore();

  useEffect(() => {
    if (!initialized) fetchSettings();
  }, [initialized, fetchSettings]);

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const overdueTasks = useMemo(
    () =>
      getOverdueTasks().sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      ),
    [getOverdueTasks, tasks]
  );
  const dueSoonTasks = useMemo(
    () =>
      getDeadlineTasks().sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      ),
    [getDeadlineTasks, tasks]
  );

  const hasTasks = overdueTasks.length > 0 || dueSoonTasks.length > 0;

  function handleEdit(task: Task) {
    setEditingTask(task);
    setIsDialogOpen(true);
  }

  function handleDelete(task: Task) {
    setDeleteTarget(task);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold sm:text-xl">Deadlines</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track overdue and upcoming task deadlines
          </p>
        </div>
      </div>

      {hasTasks ? (
        <>
          {/* Tabs */}
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs sm:text-sm gap-1.5">
                All
                <span className="text-[10px] sm:text-xs opacity-60">
                  {overdueTasks.length + dueSoonTasks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs sm:text-sm gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Overdue
                {overdueTasks.length > 0 && (
                  <span className="text-[10px] sm:text-xs opacity-60">{overdueTasks.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="dueSoon" className="text-xs sm:text-sm gap-1.5">
                Due Soon
                {dueSoonTasks.length > 0 && (
                  <span className="text-[10px] sm:text-xs opacity-60">{dueSoonTasks.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

          {/* All Tab */}
          <TabsContent value="all">
            <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-5">
              {/* Overdue */}
              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-destructive">
                      Overdue
                    </h3>
                    <span className="text-[10px] text-muted-foreground">({overdueTasks.length})</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {overdueTasks.map((task) => (
                      <CompactTaskCard
                        key={task.id}
                        task={task}
                        isOverdue
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getSettingColor={getSettingColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Due Soon */}
              {dueSoonTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10">
                      <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-muted-foreground">
                      Due Soon
                    </h3>
                    <span className="text-[10px] text-muted-foreground">({dueSoonTasks.length})</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {dueSoonTasks.map((task) => (
                      <CompactTaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getSettingColor={getSettingColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="overdue">
            <div className="mt-3 sm:mt-4">
              {overdueTasks.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No overdue tasks"
                  description="All tasks are on track. Great job!"
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {overdueTasks.map((task) => (
                    <CompactTaskCard
                      key={task.id}
                      task={task}
                      isOverdue
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getSettingColor={getSettingColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Due Soon Tab */}
          <TabsContent value="dueSoon">
            <div className="mt-3 sm:mt-4">
              {dueSoonTasks.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No upcoming deadlines"
                  description="No tasks due within the next 72 hours."
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {dueSoonTasks.map((task) => (
                    <CompactTaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getSettingColor={getSettingColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="rounded-xl border">
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming deadlines"
            description="You don't have any tasks due within the next 72 hours. Everything is on track!"
          />
        </div>
      )}

      <DeleteTaskDialog
        task={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
