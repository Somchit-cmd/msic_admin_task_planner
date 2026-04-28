'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, Eye, EyeOff, Loader2, LogIn, AlertCircle, ShieldAlert } from 'lucide-react';

// ─── Login Page (Sign In only) ──────────────────────────────────────────────

export default function AuthPage() {
  const { login, loading, error, clearError, remainingAttempts, locked } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    await login(username.trim(), password, rememberMe);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Smart Task Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
              locked
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              {locked ? <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <div>
                <p className="font-medium">{locked ? 'Account Temporarily Locked' : 'Login Failed'}</p>
                <p className="text-xs opacity-80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) clearError();
              }}
              autoComplete="username"
              autoFocus
              required
              className="h-11 rounded-lg text-base"
            />
            <p className="text-xs text-muted-foreground">Not case sensitive</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                autoComplete="current-password"
                required
                className="h-11 rounded-lg text-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer select-none">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading || !username.trim() || !password || locked}
            className="w-full h-11 rounded-lg text-base font-semibold"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4" />Sign In</>
            )}
          </Button>
        </form>

          {remainingAttempts !== null && remainingAttempts <= 3 && !locked && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout
            </p>
          )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  );
}
