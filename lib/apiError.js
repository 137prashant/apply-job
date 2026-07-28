import { NextResponse } from 'next/server';

export class DatabaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

export function handleApiError(error, context) {
  console.error(`${context}:`, error);

  if (error instanceof DatabaseConfigError) {
    return NextResponse.json(
      {
        error: 'Database not configured',
        hint: 'Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel → Settings → Environment Variables (Production), then redeploy. SQLite files cannot run on Vercel.',
      },
      { status: 503 }
    );
  }

  if (error.message?.includes('Database not configured')) {
    return NextResponse.json(
      {
        error: 'Database not configured',
        hint: 'Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel → Settings → Environment Variables (Production), then redeploy.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
