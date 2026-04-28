import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  remainingAttempts: number | null;
  locked: boolean;

  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
// Token is stored in an httpOnly cookie set by the server.
// The browser sends it automatically with every request — no localStorage needed.

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  remainingAttempts: null,
  locked: false,

  login: async (username, password, rememberMe = false) => {
    set({ loading: true, error: null, remainingAttempts: null, locked: false });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: 'include', // ensure cookies are sent
      });
      const data = await res.json();

      if (!res.ok) {
        const isLocked = res.status === 429;
        set({
          error: data.error || 'Login failed',
          remainingAttempts: data.remainingAttempts ?? null,
          locked: isLocked,
          loading: false,
        });
        return;
      }

      set({ user: data.user, loading: false, error: null, remainingAttempts: null, locked: false });
    } catch {
      set({ error: 'Network error. Please try again.', loading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors on logout
    }
    set({ user: null, loading: false, error: null, remainingAttempts: null, locked: false });
  },

  checkSession: async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        set({ user: null, loading: false });
        return;
      }

      set({ user: data.user, loading: false });
    } catch {
      clearTimeout(timeoutId);
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null, remainingAttempts: null, locked: false }),
}));
