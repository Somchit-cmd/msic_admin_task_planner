import { NextRequest, NextResponse } from 'next/server';
import { POST_login } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';

function getClientIp(req: NextRequest): string {
  // Cloudflare sets this header — trusted, cannot be spoofed
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  // Fallback for local dev
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Check rate limit before processing
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      {
        error: `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        lockedUntil: rateCheck.lockedUntil,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const response = await POST_login(req);

  // If login failed (401), record the failed attempt
  if (response.status === 401) {
    recordFailedAttempt(ip);

    // Check if this failed attempt triggered a lockout
    const afterCheck = checkRateLimit(ip);
    if (!afterCheck.allowed) {
      // Override response with lockout warning
      const minutes = Math.ceil((afterCheck.retryAfterSeconds ?? 0) / 60);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          lockedUntil: afterCheck.lockedUntil,
          retryAfterSeconds: afterCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Return original error but include remaining attempts info
    const originalBody = await response.clone().json();
    return NextResponse.json(
      {
        ...originalBody,
        remainingAttempts: afterCheck.remainingAttempts,
      },
      { status: 401 }
    );
  }

  // If login succeeded, reset the rate limit for this IP
  if (response.status === 200) {
    resetRateLimit(ip);
  }

  return response;
}
