import { NextRequest, NextResponse } from 'next/server';
import { GET_session } from '@/lib/auth';

export async function GET(req: NextRequest) {
  return GET_session(req);
}
