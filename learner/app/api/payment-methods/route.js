import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Fetching payment methods...');
    
    const paymentMethods = await query(`
      SELECT * FROM payment_methods 
      WHERE is_active = 1 
      ORDER BY method_name
    `);
    
    console.log('✅ Found payment methods:', paymentMethods.length);
    
    return NextResponse.json({ 
      success: true, 
      data: paymentMethods 
    });
  } catch (error) {
    console.error('❌ Payment methods fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('📝 Creating new payment method:', data.method_name);
    
    // Validation
    if (!data.method_code || !data.method_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Method code and name are required' 
      }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO payment_methods 
      (method_code, method_name, description, is_active, has_qr, qr_code_image, account_number, account_name, instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.method_code,
      data.method_name,
      data.description || '',
      data.is_active ?? true,
      data.has_qr || false,
      data.qr_code_image || '',
      data.account_number || '',
      data.account_name || '',
      data.instructions || ''
    ]);

    console.log('✅ Payment method created with ID:', result.insertId);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        id: result.insertId, 
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Payment method creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    console.log('📝 Updating payment method:', id);
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method ID is required' 
      }, { status: 400 });
    }

    await query(`
      UPDATE payment_methods 
      SET method_code = ?, method_name = ?, description = ?, is_active = ?, 
          has_qr = ?, qr_code_image = ?, account_number = ?, account_name = ?, 
          instructions = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.method_code,
      data.method_name,
      data.description || '',
      data.is_active ?? true,
      data.has_qr || false,
      data.qr_code_image || '',
      data.account_number || '',
      data.account_name || '',
      data.instructions || '',
      id
    ]);

    console.log('✅ Payment method updated:', id);
    
    return NextResponse.json({ 
      success: true, 
      data: { id: parseInt(id), ...data }
    });
    
  } catch (error) {
    console.error('❌ Payment method update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🗑️ Deleting payment method:', id);
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method ID is required' 
      }, { status: 400 });
    }

    await query('DELETE FROM payment_methods WHERE id = ?', [id]);

    console.log('✅ Payment method deleted:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment method deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Payment method deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}