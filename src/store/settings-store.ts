import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Setting {
  id: string;
  type: 'category' | 'priority' | 'status';
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Computed helpers (pure functions, used internally) ─────────────────────

function computeByType(settings: Setting[], type: string): Setting[] {
  return settings
    .filter((s) => s.type === type && s.isActive)
    .sort((a, b) => {
      if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
      return a.name.localeCompare(b.name);
    });
}

function computeNames(settings: Setting[], type: string): string[] {
  return computeByType(settings, type).map((s) => s.name);
}

// ─── Store State & Actions ───────────────────────────────────────────────────

interface SettingsState {
  // Raw state
  settings: Setting[];
  loading: boolean;
  initialized: boolean;

  // Cached computed lists (stable references — recomputed only when settings change)
  categories: Setting[];
  priorities: Setting[];
  statuses: Setting[];
  categoryNames: string[];
  priorityNames: string[];
  statusNames: string[];

  // Actions
  fetchSettings: () => Promise<void>;
  getSettingColor: (type: string, name: string) => string;
  invalidate: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  settings: [],
  loading: false,
  initialized: false,
  categories: [],
  priorities: [],
  statuses: [],
  categoryNames: [],
  priorityNames: [],
  statusNames: [],

  // ── API actions ────────────────────────────────────────────────────────

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data: Setting[] = await res.json();

      // Pre-compute and cache all derived lists
      set({
        settings: data,
        initialized: true,
        categories: computeByType(data, 'category'),
        priorities: computeByType(data, 'priority'),
        statuses: computeByType(data, 'status'),
        categoryNames: computeNames(data, 'category'),
        priorityNames: computeNames(data, 'priority'),
        statusNames: computeNames(data, 'status'),
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      set({ loading: false });
    }
  },

  // ── Lookup helpers ───────────────────────────────────────────────────

  getSettingColor: (type: string, name: string) => {
    const { settings } = get();
    const found = settings.find(
      (s) => s.type === type && s.name === name
    );
    return found ? found.color : '';
  },

  invalidate: () => {
    set({ initialized: false });
  },
}));
