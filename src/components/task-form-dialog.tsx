'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useTaskStore, type Task } from '@/store/task-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  return useAuthStore.getState().getAuthHeaders();
}

// ─── Form State ────────────────────────────────────────────────────────────────

interface FormState {
  taskName: string;
  category: string;
  priority: string;
  startDate: string;
  deadline: string;
  assignedTo: string;
  note: string;
  status: string;
}

const emptyForm = (): FormState => ({
  taskName: '',
  category: 'Development',
  priority: 'Medium',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  deadline: format(new Date(), 'yyyy-MM-dd'),
  assignedTo: '',
  note: '',
  status: 'Pending',
});

function formFromTask(task: Task): FormState {
  return {
    taskName: task.taskName,
    category: task.category,
    priority: task.priority,
    startDate: task.startDate,
    deadline: task.deadline,
    assignedTo: task.assignedTo,
    note: task.note,
    status: task.status,
  };
}

// ─── Inner Form (remounts via key when editingTask changes) ───────────────────

interface TaskFormContentProps {
  editingTask: Task | null;
  onClose: () => void;
}

function TaskFormContent({ editingTask, onClose }: TaskFormContentProps) {
  const { loading, addTask, updateTask } = useTaskStore();
  const isEditing = editingTask !== null;

  // ── Fetch settings ───────────────────────────────────────────────────────
  const {
    fetchSettings,
    initialized,
    categoryNames,
    priorityNames,
    statusNames,
  } = useSettingsStore();

  useEffect(() => {
    if (!initialized) {
      fetchSettings();
    }
  }, [initialized, fetchSettings]);

  const categories = categoryNames;
  const priorities = priorityNames;
  const statuses = statusNames;

  // ── Fetch assignable (non-admin) users ───────────────────────────────────
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; username: string; name: string | null }[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/users?role=user&status=active', {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAssignableUsers(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const [form, setForm] = useState<FormState>(
    editingTask ? formFromTask(editingTask) : emptyForm
  );
  const [errors, setErrors] = useState<{ taskName?: string }>({});

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (key === 'taskName' && value.trim()) {
        setErrors({});
      }
    },
    []
  );

  const validate = useCallback((): boolean => {
    if (!form.taskName.trim()) {
      setErrors({ taskName: 'Task name is required' });
      return false;
    }
    setErrors({});
    return true;
  }, [form.taskName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      try {
        if (editingTask) {
          await updateTask(editingTask.id, {
            taskName: form.taskName.trim(),
            category: form.category,
            priority: form.priority,
            startDate: form.startDate,
            deadline: form.deadline,
            assignedTo: form.assignedTo.trim(),
            note: form.note.trim(),
            status: form.status,
          });
        } else {
          await addTask({
            taskName: form.taskName.trim(),
            category: form.category,
            priority: form.priority,
            startDate: form.startDate,
            deadline: form.deadline,
            assignedTo: form.assignedTo.trim(),
            note: form.note.trim(),
            status: form.status,
          });
        }
        onClose();
      } catch (error) {
        console.error('Failed to save task:', error);
      }
    },
    [form, editingTask, validate, addTask, updateTask, onClose]
  );

  // Use settings values for defaults if available
  const defaultCategory = categories.length > 0 ? categories[0] : 'Development';
  const defaultPriority = priorities.includes('Medium') ? 'Medium' : (priorities[0] || 'Medium');
  const defaultStatus = statuses.includes('Pending') ? 'Pending' : (statuses[0] || 'Pending');

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the details of your task below.'
            : 'Fill in the details to create a new task.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Task Name — full width */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="taskName">
            Task Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taskName"
            placeholder="Enter task name"
            value={form.taskName}
            onChange={(e) => updateField('taskName', e.target.value)}
            aria-invalid={!!errors.taskName}
            className="h-11 sm:h-10"
          />
          {errors.taskName && (
            <p className="text-sm text-destructive">{errors.taskName}</p>
          )}
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Category */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger className="w-full" id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="priority">
              Priority <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.priority}
              onValueChange={(value) => updateField('priority', value)}
            >
              <SelectTrigger className="w-full" id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="startDate">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="deadline">
              Deadline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select
              value={form.assignedTo || '__none__'}
              onValueChange={(value) => updateField('assignedTo', value === '__none__' ? '' : value)}
            >
              <SelectTrigger className="w-full" id="assignedTo">
                {usersLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </span>
                ) : (
                  <SelectValue placeholder="Unassigned" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.name || u.username}>
                    {u.name || u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField('status', value)}
            >
              <SelectTrigger className="w-full" id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Note — full width */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            placeholder="Optional notes about this task..."
            value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter className="flex-row gap-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 sm:h-10 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 h-11 sm:h-10 sm:flex-none"
          >
            {loading
              ? isEditing
                ? 'Saving...'
                : 'Adding...'
              : isEditing
                ? 'Save Changes'
                : 'Add Task'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Main Dialog ───────────────────────────────────────────────────────────────

export default function TaskFormDialog() {
  const { isDialogOpen, editingTask, setIsDialogOpen, setEditingTask } =
    useTaskStore();

  const handleClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingTask(null);
  }, [setIsDialogOpen, setEditingTask]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <TaskFormContent
          key={editingTask?.id ?? '__new__'}
          editingTask={editingTask}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
