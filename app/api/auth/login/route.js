import { NextResponse } from 'next/server';
import { isValidAccessKey } from '../../../../lib/accessKey';
import {
  createAuthToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { key } = await request.json();

    if (!isValidAccessKey(key)) {
      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 401 }
      );
    }

    const token = await createAuthToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}
