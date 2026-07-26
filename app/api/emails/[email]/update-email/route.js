import { NextResponse } from 'next/server';
import Database from '../../../../../lib/database';

const db = new Database();

export async function PUT(request, { params }) {
  try {
    const { email } = params;
    const { newEmail } = await request.json();
    
    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json(
        { error: 'New email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Update the email address
    await db.updateEmailAddress(email, newEmail.trim());
    
    return NextResponse.json({ 
      message: 'Email address updated successfully',
      oldEmail: email,
      newEmail: newEmail.trim()
    });
    
  } catch (error) {
    console.error('Error updating email address:', error);
    
    if (error.message === 'Email address already exists') {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

