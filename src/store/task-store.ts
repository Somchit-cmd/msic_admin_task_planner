import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  taskName: string;
  category: string;
  priority: string;
  startDate: string;
  deadline: string;
  assignedTo: string;
  note: string;
  status: string;
  createdAt: string;
}

export type TaskView = 'dashboard' | 'today' | 'all' | 'deadlines' | 'users' | 'settings';
export type SortField = 'priority' | 'deadline' | 'createdAt' | null;
export type SortOrder = 'asc' | 'desc';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// Dynamic priority weight lookup — uses settings store when available
// Falls back to hardcoded defaults for backward compatibility
function priorityWeight(priority: string): number {
  const known: Record<string, number> = {
    'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1,
    'Urgent': 4, 'Normal': 2, 'Minor': 1,
  };
  return known[priority] ?? 0;
}

// ─── Store State & Actions ───────────────────────────────────────────────────

interface TaskState {
  // State
  tasks: Task[];
  loading: boolean;
  currentView: TaskView;
  sortBy: SortField;
  sortOrder: SortOrder;
  editingTask: Task | null;
  isDialogOpen: boolean;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentView: (view: TaskView) => void;
  setSortBy: (field: SortField) => void;
  toggleSortOrder: () => void;
  setEditingTask: (task: Task | null) => void;
  setIsDialogOpen: (open: boolean) => void;

  // Computed helpers
  getTodayTasks: () => Task[];
  getDeadlineTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getSortedTasks: (tasks?: Task[]) => Task[];
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  tasks: [],
  loading: false,
  currentView: 'dashboard',
  sortBy: null,
  sortOrder: 'asc',
  editingTask: null,
  isDialogOpen: false,

  // ── API actions ────────────────────────────────────────────────────────

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: Task[] = await res.json();
      set({ tasks: data });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTask: async (task: Omit<Task, 'id' | 'createdAt'>) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const created: Task = await res.json();
      set((state) => ({ tasks: [...state.tasks, created] }));
      return created;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id: string, task: Partial<Task>) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
        editingTask: state.editingTask?.id === id ? updated : state.editingTask,
      }));
      return updated;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        editingTask: state.editingTask?.id === id ? null : state.editingTask,
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  // ── UI actions ─────────────────────────────────────────────────────────

  setCurrentView: (view) => set({ currentView: view }),

  setSortBy: (field) => set({ sortBy: field }),

  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  setEditingTask: (task) => set({ editingTask: task }),

  setIsDialogOpen: (open) => set({ isDialogOpen: open }),

  // ── Computed helpers ───────────────────────────────────────────────────

  getTodayTasks: () => {
    const today = toDateString(new Date());
    return get().tasks.filter((t) => t.startDate === today);
  },

  getDeadlineTasks: () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72h from now
    return get().tasks.filter((t) => {
      if (t.status === 'Completed') return false;
      const deadline = new Date(t.deadline);
      return deadline >= now && deadline <= cutoff;
    });
  },

  getOverdueTasks: () => {
    const today = toDateString(new Date());
    return get().tasks.filter(
      (t) => t.deadline < today && t.status !== 'Completed'
    );
  },

  getSortedTasks: (tasks) => {
    const list = tasks ?? get().tasks;
    const { sortBy, sortOrder } = get();
    if (!sortBy) return list;

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case 'priority':
          cmp = priorityWeight(a.priority) - priorityWeight(b.priority);
          break;
        case 'deadline':
          cmp =
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'createdAt':
          cmp =
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return sorted;
  },
}));
