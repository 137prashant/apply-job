import { NextResponse } from 'next/server';
import Database from '../../../../lib/database';

const db = new Database();

export async function PUT(request, { params }) {
  try {
    const { email } = params;
    const { name, company, hrNumber, isApplied, hrReplied, hrReplyNotes } = await request.json();
    
    if (name !== undefined) {
      await db.updateEmailName(email, name);
    }
    
    if (company !== undefined) {
      await db.updateCompany(email, company);
    }

    if (hrNumber !== undefined) {
      await db.updateHrNumber(email, hrNumber);
    }
    
    if (isApplied !== undefined) {
      const appliedDate = isApplied ? new Date().toISOString() : null;
      await db.updateApplicationStatus(email, isApplied, appliedDate);
    }
    
    if (hrReplied !== undefined) {
      await db.updateHrReplyStatus(email, hrReplied, hrReplyNotes);
    }
    
    return NextResponse.json({ message: 'Application updated successfully' });
    
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { email } = params;
    
    await db.deleteApplication(email);
    
    return NextResponse.json({ message: 'Application deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

