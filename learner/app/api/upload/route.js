// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('qrCode');
    const methodId = formData.get('methodId');

    console.log('📤 Upload request received:', { 
      methodId, 
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size 
    });

    if (!file || !methodId) {
      return NextResponse.json(
        { success: false, error: 'File and method ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('📊 File converted to buffer, size:', buffer.length);

    // Update database with ALL QR code fields
    const result = await query(
      `UPDATE payment_methods 
       SET qr_code_data = ?, 
           qr_code_filename = ?, 
           qr_code_mimetype = ?, 
           has_qr = TRUE 
       WHERE id = ?`,
      [buffer, file.name, file.type, parseInt(methodId)]
    );

    console.log('✅ Database update completed:', result);

    // Verify the update worked
    const verify = await query(
      `SELECT 
          id, 
          method_name,
          has_qr,
          qr_code_filename,
          qr_code_mimetype,
          LENGTH(qr_code_data) as data_size
       FROM payment_methods 
       WHERE id = ?`,
      [parseInt(methodId)]
    );

    console.log('🔍 Verification result:', verify[0]);

    if (verify.length > 0 && verify[0].data_size > 0) {
      return NextResponse.json({
        success: true,
        message: 'QR code uploaded successfully',
        data: {
          methodId: methodId,
          fileName: file.name,
          fileSize: buffer.length,
          storedSize: verify[0].data_size
        }
      });
    } else {
      throw new Error('QR code data was not saved to database');
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}