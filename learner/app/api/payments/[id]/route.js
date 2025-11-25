import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    // ✅ FIX: Await the params promise
    const { id } = await params;
    const { status } = await request.json();
    
    console.log('🔄 Updating payment status - ID:', id, 'Status:', status);
    
    if (!id || id === '0') {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid Payment ID is required' 
      }, { status: 400 });
    }

    // Update the payment status
    const result = await query(
      'UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    console.log('✅ Database update result:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      data: { id: parseInt(id), status: status }
    });
    
  } catch (error) {
    console.error('❌ Payment status update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}