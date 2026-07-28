import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { handleApiError } from '../../../../lib/apiError';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [stats, recentApplied, appliedByDate] = await Promise.all([
      db.getApplicationStats(),
      db.getRecentAppliedApplications(5),
      db.getAppliedCountByDate(7),
    ]);

    return NextResponse.json({
      ...stats,
      recentApplied,
      appliedByDate,
    });
  } catch (error) {
    return handleApiError(error, 'Error fetching application stats');
  }
}
