import { NextRequest, NextResponse } from 'next/server';
import { POST_logout } from '@/lib/auth';

export async function POST(req: NextRequest) {
  return POST_logout(req);
}
