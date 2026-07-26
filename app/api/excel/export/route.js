import { NextResponse } from 'next/server';
import Database from '../../../../lib/database';
import ExcelService from '../../../../lib/excelService';
import path from 'path';
import fs from 'fs';

const db = new Database();

export async function GET(request) {
  try {
    const applications = await db.getAllApplications();
    
    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'No applications found to export' },
        { status: 404 }
      );
    }

    const filename = `job_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    ExcelService.exportToExcel(applications, filepath);
    
    // Read the file and send as response
    const fileBuffer = fs.readFileSync(filepath);
    
    // Clean up the temporary file
    fs.unlinkSync(filepath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

