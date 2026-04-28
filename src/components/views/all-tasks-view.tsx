"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  Undo2,
  ArrowUp,
  ArrowDown,
  Search,
  Clock,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTaskStore, type Task, type SortField } from "@/store/task-store";
import { useSettingsStore } from "@/store/settings-store";
import { useAuthStore } from "@/store/auth-store";
import { differenceInDays, format } from "date-fns";
import { DeleteTaskDialog } from "@/components/delete-task-dialog";
import { CompleteTaskDialog } from "@/components/complete-task-dialog";

const PAGE_SIZE = 10;

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

const STATUS_STYLES: Record<string, string> = {
  ...PRIORITY_STYLES,
};

function getPriorityBadgeClass(priority: string, color: string): string {
  if (color && PRIORITY_STYLES[color]) return `border-transparent ${PRIORITY_STYLES[color]}`;
  // Fallback for known priorities
  switch (priority) {
    case "High": return "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "Medium": return "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "Low": return "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "border-transparent bg-muted text-muted-foreground";
  }
}

function getStatusBadgeClass(status: string, color: string): string {
  if (color && STATUS_STYLES[color]) return `border-transparent ${STATUS_STYLES[color]}`;
  // Fallback for known statuses
  switch (status) {
    case "Pending": return "border-transparent";
    case "In Progress": return "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "Completed": return "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "border-transparent";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRemainingInfo(task: Task) {
  const days = differenceInDays(new Date(task.deadline), new Date());
  const isCompleted = task.status === "Completed";

  if (isCompleted) {
    return { label: "Completed", color: "text-muted-foreground" };
  }
  if (days < 0) {
    return {
      label: `Overdue ${Math.abs(days)}d`,
      color: "text-destructive font-medium",
    };
  }
  if (days === 0) {
    return { label: "Due today", color: "text-amber-600 font-medium" };
  }
  if (days <= 3) {
    return {
      label: `${days}d left`,
      color: "text-amber-600 font-medium",
    };
  }
  return { label: `${days}d left`, color: "text-green-600" };
}

// ─── Mobile Task Card ─────────────────────────────────────────────────────────

function MobileTaskCard({
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
  const remaining = getRemainingInfo(task);
  const isOverdue = task.status !== "Completed" && differenceInDays(new Date(task.deadline), new Date()) < 0;
  const priorityColor = getSettingColor("priority", task.priority);
  const statusColor = getSettingColor("status", task.status);
  const categoryColor = getSettingColor("category", task.category);

  return (
    <Card className={isOverdue ? "border-destructive/30 bg-destructive/5" : ""}>
      <CardContent className="p-3.5">
        {/* Top row: name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug truncate">{task.taskName}</h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg",
                task.status === "Completed"
                  ? "text-amber-600 hover:text-amber-600"
                  : "text-emerald-600 hover:text-emerald-600"
              )}
              onClick={() => onComplete(task)}
              aria-label={task.status === "Completed" ? "Reopen task" : "Mark as complete"}
            >
              {task.status === "Completed" ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.taskName}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
              onClick={() => onDelete(task)}
              aria-label={`Delete ${task.taskName}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityBadgeClass(task.category, categoryColor))}>{task.category}</Badge>
          <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityBadgeClass(task.priority, priorityColor))}>{task.priority}</Badge>
          <Badge className={cn("text-[10px] px-1.5 py-0", getStatusBadgeClass(task.status, statusColor))}>{task.status}</Badge>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(task.deadline), "MMM d")}
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedTo}
              </span>
            )}
          </div>
          <span className={remaining.color}>{remaining.label}</span>
        </div>

        {/* Note */}
        {task.note && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-2">
            {task.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllTasksView() {
  const {
    tasks,
    loading,
    sortBy,
    sortOrder,
    getSortedTasks,
    setSortBy,
    toggleSortOrder,
    setEditingTask,
    setIsDialogOpen,
  } = useTaskStore();

  // ── Settings ──────────────────────────────────────────────────────────────
  const { fetchSettings, initialized, categoryNames, priorityNames, statusNames, getSettingColor } = useSettingsStore();

  useEffect(() => {
    if (!initialized) fetchSettings();
  }, [initialized, fetchSettings]);

  // ── Fetch assignable users for filter ─────────────────────────────────────
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; username: string; name: string | null }[]>([]);

  function getAuthHeaders(): Record<string, string> {
    return useAuthStore.getState().getAuthHeaders();
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users?role=user&status=active', { headers: getAuthHeaders() })
      .then((r) => { if (r.ok) return r.json(); })
      .then((data) => { if (!cancelled && data) setAssignableUsers(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const categories = categoryNames;
  const priorities = priorityNames;
  const statuses = statusNames;

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setDeleteTarget(task);
    setDeleteDialogOpen(true);
  };

  const handleCompleteClick = (task: Task) => {
    setCompleteTarget(task);
    setCompleteDialogOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => { setCategoryFilter(value); setCurrentPage(1); };
  const handlePriorityFilter = (value: string) => { setPriorityFilter(value); setCurrentPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setCurrentPage(1); };
  const handleAssigneeFilter = (value: string) => { setAssigneeFilter(value); setCurrentPage(1); };

  const clearAllFilters = () => {
    setCategoryFilter("All");
    setPriorityFilter("All");
    setStatusFilter("All");
    setAssigneeFilter("All");
    setCurrentPage(1);
  };

  const activeFilterCount = [categoryFilter, priorityFilter, statusFilter, assigneeFilter].filter((v) => v !== "All").length;

  const handleSortCycle = () => {
    const nextField: SortField | null =
      sortBy === null ? "priority" : sortBy === "priority" ? "deadline" : null;
    setSortBy(nextField);
  };

  const SortIcon = sortBy && sortOrder === "asc" ? ArrowUp : ArrowDown;

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.taskName.toLowerCase().includes(query));
    }
    if (categoryFilter !== "All") result = result.filter((t) => t.category === categoryFilter);
    if (priorityFilter !== "All") result = result.filter((t) => t.priority === priorityFilter);
    if (statusFilter !== "All") result = result.filter((t) => t.status === statusFilter);
    if (assigneeFilter !== "All") result = result.filter((t) => t.assignedTo === assigneeFilter);
    return getSortedTasks(result);
  }, [tasks, searchQuery, categoryFilter, priorityFilter, statusFilter, assigneeFilter, sortBy, sortOrder, getSortedTasks]);

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const paginatedTasks = useMemo(
    () => filteredTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTasks, currentPage]
  );
  const startItem = filteredTasks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredTasks.length);

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">All Tasks</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Manage all your tasks in one place
          </p>
        </div>
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────── */}
      {/* Row 1: Search + Sort + Filter toggle (always visible) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Desktop: inline filter dropdowns */}
        <div className="hidden lg:flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Priorities</SelectItem>
              {priorities.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={handleAssigneeFilter}>
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Assignees</SelectItem>
              {assignableUsers.map((u) => (
                <SelectItem key={u.id} value={u.name || u.username}>{u.name || u.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile/Tablet: filter popover */}
        <div className="lg:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-3 gap-1.5">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="end">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Filters</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Priorities" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Priorities</SelectItem>
                      {priorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      {statuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assigned To</Label>
                  <Select value={assigneeFilter} onValueChange={handleAssigneeFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Assignees" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Assignees</SelectItem>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.name || u.username}>{u.name || u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          onClick={handleSortCycle}
          className="shrink-0 h-10 px-3"
          aria-label="Sort tasks"
        >
          {sortBy ? (
            <>
              <SortIcon className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline text-sm">{sortBy === "priority" ? "Priority" : "Deadline"}</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline text-sm">Sort</span>
            </>
          )}
        </Button>
      </div>

      {/* Active filter pills (desktop) */}
      {activeFilterCount > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          {categoryFilter !== "All" && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs cursor-pointer hover:bg-secondary/80" onClick={() => setCategoryFilter("All")}>
              Category: {categoryFilter} <X className="h-3 w-3" />
            </Badge>
          )}
          {priorityFilter !== "All" && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs cursor-pointer hover:bg-secondary/80" onClick={() => setPriorityFilter("All")}>
              Priority: {priorityFilter} <X className="h-3 w-3" />
            </Badge>
          )}
          {statusFilter !== "All" && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs cursor-pointer hover:bg-secondary/80" onClick={() => setStatusFilter("All")}>
              Status: {statusFilter} <X className="h-3 w-3" />
            </Badge>
          )}
          {assigneeFilter !== "All" && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs cursor-pointer hover:bg-secondary/80" onClick={() => setAssigneeFilter("All")}>
              Assignee: {assigneeFilter} <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* ── Mobile: Card Layout ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-2.5">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No tasks found.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <MobileTaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onComplete={handleCompleteClick}
              getSettingColor={getSettingColor}
            />
          ))
        )}
      </div>

      {/* ── Desktop: Table Layout ───────────────────────────────────────── */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-340px)] overflow-y-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-10 bg-card shadow-sm border-b">
                <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <TableHead>Task Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading && tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Loading tasks...
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task) => {
                    const remaining = getRemainingInfo(task);
                    const priorityColor = getSettingColor("priority", task.priority);
                    const statusColor = getSettingColor("status", task.status);
                    const categoryColor = getSettingColor("category", task.category);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {task.taskName}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getPriorityBadgeClass(task.category, categoryColor))}>{task.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getPriorityBadgeClass(task.priority, priorityColor))}>{task.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusBadgeClass(task.status, statusColor))}>{task.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {task.assignedTo || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(task.deadline), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className={remaining.color}>{remaining.label}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                task.status === "Completed"
                                  ? "text-amber-600 hover:text-amber-600"
                                  : "text-emerald-600 hover:text-emerald-600"
                              )}
                              onClick={() => handleCompleteClick(task)}
                              aria-label={task.status === "Completed" ? "Reopen task" : "Mark as complete"}
                            >
                              {task.status === "Completed" ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(task)}
                              aria-label={`Edit ${task.taskName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(task)}
                              aria-label={`Delete ${task.taskName}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Showing {startItem}–{endItem} of {filteredTasks.length} tasks
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Delete Dialog ───────────────────────────────────────────────── */}
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
