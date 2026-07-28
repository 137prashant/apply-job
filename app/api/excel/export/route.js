import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import ExcelService from '../../../../lib/excelService';
import { handleApiError } from '../../../../lib/apiError';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const applications = await db.getAllApplications();

    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'No applications found to export' },
        { status: 404 }
      );
    }

    const filename = `job_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileBuffer = ExcelService.exportToBuffer(applications);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Error exporting to Excel');
  }
}
