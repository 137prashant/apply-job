import { NextResponse } from 'next/server';
import db from '../../../../lib/database';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const health = await db.checkHealth();

    if (!health.ok) {
      return NextResponse.json(
        {
          ...health,
          hint: 'Create a free database at https://turso.tech → add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to Vercel → redeploy.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(health);
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message: error.message || 'Database connection failed',
        hint: 'Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are correct, then redeploy.',
      },
      { status: 503 }
    );
  }
}
