import { NextResponse } from 'next/server';
import db from '../../../lib/database';
import EmailFilter from '../../../lib/emailFilter';
import { parseFilters, PAGE_SIZE } from '../../../lib/applicationQuery';
import { handleApiError } from '../../../lib/apiError';

export const runtime = 'nodejs';

export async function POST(request) {
  try {    
    const { emails } = await request.json();
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    // Process emails: filter Gmail, remove duplicates, validate
    const processedEmails = EmailFilter.processEmailList(emails);
    
    // Check for existing emails in database
    const newEmails = await EmailFilter.checkExistingEmails(processedEmails, db);
    
    if (newEmails.length === 0) {
      return NextResponse.json({
        message: 'No new emails to add',
        processedCount: processedEmails.length,
        newCount: 0
      });
    }

    // Add new emails to database
    const result = await db.addEmails(newEmails);
    
    return NextResponse.json({
      message: 'Emails processed successfully',
      processedCount: processedEmails.length,
      newCount: result.successCount,
      duplicateCount: processedEmails.length - newEmails.length,
      gmailFilteredCount: emails.length - processedEmails.length
    });
    
  } catch (error) {
    return handleApiError(error, 'Error processing emails');
  }
}

export async function DELETE(request) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    const result = await db.deleteApplications(emails);

    return NextResponse.json({
      message: 'Applications deleted successfully',
      deletedCount: result.changes
    });
  } catch (error) {
    return handleApiError(error, 'Error deleting applications');
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE), 10))
    );

    const result = await db.queryApplications(filters, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Error fetching applications');
  }
}

