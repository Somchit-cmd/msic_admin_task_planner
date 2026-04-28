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
  token: string | null;
  loading: boolean;
  error: string | null;
  remainingAttempts: number | null;
  locked: boolean;

  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  getAuthHeaders: () => Record<string, string>;
}

// ─── Store ───────────────────────────────────────────────────────────────────
// Token is stored both in httpOnly cookie (server-side) and in memory (client-side).
// The in-memory token is used as Authorization header fallback for cross-origin scenarios
// where cookies may not be sent (e.g., embedded iframes, proxies).

// Try to restore token from sessionStorage (survives page refresh within same tab)
const savedToken = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: savedToken,
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

      // Store token in memory and sessionStorage for cross-origin fallback
      const token = data.token || null;
      if (token) {
        sessionStorage.setItem('auth_token', token);
      }

      set({ user: data.user, token, loading: false, error: null, remainingAttempts: null, locked: false });
    } catch {
      set({ error: 'Network error. Please try again.', loading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: get().getAuthHeaders(),
      });
    } catch {
      // Ignore errors on logout
    }
    sessionStorage.removeItem('auth_token');
    set({ user: null, token: null, loading: false, error: null, remainingAttempts: null, locked: false });
  },

  checkSession: async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        signal: controller.signal,
        headers: get().getAuthHeaders(),
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        // If cookie auth failed but we have a token, try without cookie
        const { token } = get();
        if (token) {
          const retryRes = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(5000),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            set({ user: retryData.user, loading: false });
            return;
          }
        }
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

  getAuthHeaders: () => {
    const { token } = get();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },
}));
