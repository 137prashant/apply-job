import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import EmailService from '../../../../lib/emailService';
import { handleApiError } from '../../../../lib/apiError';

export const runtime = 'nodejs';

export async function POST(request) {
  try {    
    const { emails, cvPath, provider = 'sendgrid' } = await request.json();
    const emailService = new EmailService(provider);
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    // Clean email data
    const cleanedEmails = emails.map(email => ({
      ...email,
      email: email.email?.replace(/^"(.*)"$/, '$1').trim() || email.email
    }));

    // Verify email service connection
    const connectionTest = await emailService.verifyConnection();
    if (!connectionTest.success) {
      console.error('Email service connection failed:', connectionTest.error);
      return NextResponse.json(
        { error: 'Email service not configured properly', details: connectionTest.error },
        { status: 500 }
      );
    }

    // Send emails
    const results = await emailService.sendBulkEmails(cleanedEmails, cvPath);
    
    // Update database with successful sends
    const successfulSends = results.filter(result => result.success);
    const currentDate = new Date().toISOString();
    
    for (const result of successfulSends) {
      await db.updateApplicationStatus(result.email, true, currentDate);
    }
    
    return NextResponse.json({
      message: 'Email sending completed',
      totalSent: successfulSends.length,
      totalFailed: results.length - successfulSends.length,
      results: results
    });
    
  } catch (error) {
    return handleApiError(error, 'Error sending emails');
  }
}

