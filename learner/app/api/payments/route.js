import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// In your /api/payments/route.js
export async function GET() {
  try {
    const payments = await query(`
      SELECT 
        p.*,
        s.student_id,
        s.student_name,
        s.grade,
        s.section,
        s.adviser,
        pm.method_name as payment_method_name
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      WHERE s.status != 'INACTIVE'
      ORDER BY p.created_at DESC
    `);

    console.log('📊 PAYMENTS FROM DATABASE:', payments.map(p => ({
      id: p.id,
      status: p.status,
      student_name: p.student_name
    })));

    return NextResponse.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
export async function POST(request) {
  try {
    const body = await request.json();
    const { student_ids, amount, description, desc, due_date } = body;

    console.log('📥 Received payment creation request:', body);

    // Validate required fields
    if (!student_ids || !student_ids.length || !amount) {
      return NextResponse.json(
        { success: false, error: 'Student IDs and amount are required' },
        { status: 400 }
      );
    }

    // Create payments for each student
    const createdPayments = [];
    
    for (const student_id of student_ids) {
      console.log(`🔄 Creating payment for student ${student_id}`);
      
      const payment = {
        student_id: parseInt(student_id),
        amount: parseFloat(amount),
        description: description || 'Payment',
        desc: desc || null,
        due_date: due_date || null,
        status: 'pending',
        payment_method_id: null,
        reference_number: null,
        reference_file: null,
        paid_date: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Insert into database - escape reserved keywords with backticks
      const result = await query(
        `INSERT INTO payments (
          student_id, payment_method_id, amount, description, \`desc\`, due_date, 
          status, reference_number, reference_file, paid_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.student_id,
          payment.payment_method_id,
          payment.amount,
          payment.description,
          payment.desc,
          payment.due_date,
          payment.status,
          payment.reference_number,
          payment.reference_file,
          payment.paid_date,
          payment.created_at,
          payment.updated_at
        ]
      );

      const insertedId = result.insertId;
      
      // Fetch the complete payment record
      const completePayment = await query(`
        SELECT 
          p.*,
          s.student_id as student_code,
          s.student_name,
          s.grade,
          s.section,
          s.adviser,
          pm.method_name as payment_method_name
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.id
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        WHERE p.id = ?
      `, [insertedId]);

      if (completePayment && completePayment[0]) {
        createdPayments.push(completePayment[0]);
      }
    }

    console.log(`✅ Successfully created ${createdPayments.length} payment(s)`);

    return NextResponse.json({
      success: true,
      message: `Created ${createdPayments.length} payment(s) successfully`,
      data: createdPayments
    });

  } catch (error) {
    console.error('💥 Error creating payments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}