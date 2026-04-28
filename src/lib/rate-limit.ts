// ─── Simple in-memory rate limiter for login ─────────────────────────────────
// Tracks failed login attempts per IP address.
// After MAX_ATTEMPTS failures within WINDOW_MS, blocks for LOCKOUT_MS.

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes — counting window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes — lockout duration

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

// Survive HMR via globalThis
const _global = globalThis as unknown as { __rateLimits?: Map<string, AttemptRecord> };
const rateLimits: Map<string, AttemptRecord> = _global.__rateLimits ?? new Map<string, AttemptRecord>();
if (!_global.__rateLimits) _global.__rateLimits = rateLimits;

function cleanOldEntries() {
  const now = Date.now();
  for (const [key, record] of rateLimits) {
    // Remove if window expired and not locked
    if (!record.lockedUntil && (now - record.firstAttemptAt) > WINDOW_MS) {
      rateLimits.delete(key);
    }
    // Remove if lockout expired
    if (record.lockedUntil && now > record.lockedUntil) {
      rateLimits.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: number | null; // timestamp in ms, or null
  retryAfterSeconds: number | null; // seconds until unlocked, or null
}

export function checkRateLimit(ip: string): RateLimitResult {
  cleanOldEntries();

  const now = Date.now();
  const record = rateLimits.get(ip);

  // No record — all clear
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, retryAfterSeconds: null };
  }

  // Currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
    };
  }

  // Lockout expired — reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    rateLimits.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, retryAfterSeconds: null };
  }

  // Window expired — reset
  if ((now - record.firstAttemptAt) > WINDOW_MS) {
    rateLimits.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, retryAfterSeconds: null };
  }

  // Within window, check remaining
  const remaining = MAX_ATTEMPTS - record.count;
  if (remaining <= 0) {
    // Lock it
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
    };
  }

  return { allowed: true, remainingAttempts: remaining, lockedUntil: null, retryAfterSeconds: null };
}

export function recordFailedAttempt(ip: string) {
  cleanOldEntries();

  const now = Date.now();
  let record = rateLimits.get(ip);

  if (!record) {
    record = { count: 0, firstAttemptAt: now, lockedUntil: null };
    rateLimits.set(ip, record);
  }

  record.count++;

  // Check if this attempt triggers lockout
  if (record.count >= MAX_ATTEMPTS && !record.lockedUntil) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
}

export function resetRateLimit(ip: string) {
  rateLimits.delete(ip);
}
