import { NextResponse } from 'next/server';
import EmailService from '../../../lib/emailService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'sendgrid';
    const emailService = new EmailService(provider);

    const connectionTest = await emailService.verifyConnection();

    return NextResponse.json({
      provider,
      providers: EmailService.getProviderStatus(),
      emailConfig: {
        from: process.env.EMAIL_FROM,
        apiKeySet: !!process.env.SENDGRID_API_KEY,
        gmailConfigured: !!process.env.GMAIL_APP_PASSWORD,
      },
      connectionTest,
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
