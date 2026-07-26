import { NextResponse } from 'next/server';
import db from '../../../../lib/database';

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
    console.error('Error fetching application stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
