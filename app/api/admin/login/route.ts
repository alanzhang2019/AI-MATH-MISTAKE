import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { signAdminToken } from '@/lib/admin/auth';

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return apiError('INTERNAL_ERROR', 500, 'Admin password is not configured');
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  if (!body.password) {
    return apiError('MISSING_REQUIRED_FIELD', 400, 'Password is required');
  }

  const encoder = new TextEncoder();
  const a = encoder.encode(body.password);
  const b = encoder.encode(adminPassword);

  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return apiError('INVALID_REQUEST', 401, 'Invalid password');
  }

  const token = await signAdminToken();
  const cookieStore = await cookies();
  
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production',
  });

  return apiSuccess({ valid: true });
}
