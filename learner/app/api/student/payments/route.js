// app/api/student/payments/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    console.log('📥 GET /api/student/payments called with studentId:', studentId)

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student ID is required' 
        },
        { status: 400 }
      )
    }

    // Get student info first to get the student's database ID
    const studentInfo = await query(`
      SELECT id FROM students WHERE student_id = ? AND (status = 'ACTIVE' OR status IS NULL OR status = '')
    `, [studentId])

    if (studentInfo.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student not found' 
        },
        { status: 404 }
      )
    }

    const studentDbId = studentInfo[0].id

    // Fetch payments for this student
    const payments = await query(`
      SELECT 
        p.id,
        p.student_id,
        p.amount,
        p.status,
        p.reference_number,
        p.reference_file,
        p.description,
        p.desc,
        p.due_date,
        p.paid_date,
        p.created_at,
        p.updated_at,
        pm.method_name as payment_method,
        s.student_name,
        s.grade,
        s.section,
        s.adviser
      FROM payments p
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      LEFT JOIN students s ON p.student_id = s.id
      WHERE p.student_id = ?
      ORDER BY p.created_at DESC
    `, [studentDbId])

    console.log(`✅ Found ${payments.length} payments for student ${studentId}`)

    // Transform data to match your frontend schema with proper types
    const transformedData = payments.map(payment => ({
      id: payment.id, // This is a number from DB
      student_id: studentId, // Use the provided studentId
      student_name: payment.student_name || '',
      grade: payment.grade || '',
      section: payment.section || '',
      adviser: payment.adviser || '',
      amount: parseFloat(payment.amount) || 0,
      status: payment.status || 'pending',
      payment_method: (payment.payment_method?.toLowerCase() || 'cash'),
      reference_number: payment.reference_number, // Can be null
      reference_file: payment.reference_file, // Can be null
      description: payment.description || payment.desc || '', // Handle both description and desc fields
      due_date: payment.due_date ? new Date(payment.due_date).toISOString().split('T')[0] : null, // Format date
      paid_date: payment.paid_date ? new Date(payment.paid_date).toISOString() : null,
      created_at: payment.created_at ? new Date(payment.created_at).toISOString() : new Date().toISOString(),
      updated_at: payment.updated_at ? new Date(payment.updated_at).toISOString() : new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('❌ Error in GET /api/student/payments:', error)
    console.error('❌ Error details:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payment data',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// app/api/student/payments/route.js - PUT method
export async function PUT(request) {
  try {
    const { paymentId, studentId, referenceNumber, methodId, amount, description, status } = await request.json()

    console.log('📥 PUT /api/student/payments called with:', {
      paymentId, studentId, referenceNumber, methodId, amount, description, status
    })

    if (!studentId || !referenceNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId and referenceNumber are required' },
        { status: 400 }
      )
    }

    // Get student's database ID first
    const studentInfo = await query(
      `SELECT id, student_name FROM students WHERE student_id = ?`,
      [studentId]
    )

    console.log('🔍 Student info:', studentInfo)

    if (studentInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentDbId = studentInfo[0].id
    const studentName = studentInfo[0].student_name

    let resultPaymentId = paymentId

    // If no paymentId provided, create a new payment
    if (!paymentId) {
      if (!methodId) {
        return NextResponse.json(
          { success: false, error: 'methodId is required for new payments' },
          { status: 400 }
        )
      }

      console.log('💰 Creating new payment for student:', studentDbId)
      
      const createResult = await query(
        `INSERT INTO payments (student_id, student_name, amount, description, payment_method_id, reference_number, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [studentDbId, studentName, parseFloat(amount || 0), description || 'Payment submitted', parseInt(methodId), referenceNumber, status || 'forapproval']
      )

      resultPaymentId = createResult.insertId
      console.log('✅ Created new payment with ID:', resultPaymentId)
    } else {
      // Update existing payment - include payment_method_id in the update
      console.log('📝 Updating existing payment:', paymentId, 'for student:', studentDbId)
      
      // First, let's check if the payment exists and get current data
      const existingPayment = await query(
        `SELECT payment_method_id FROM payments WHERE id = ? AND student_id = ?`,
        [parseInt(paymentId), studentDbId]
      )

      if (existingPayment.length === 0) {
        console.log('❌ Payment not found')
        return NextResponse.json(
          { success: false, error: 'Payment not found' },
          { status: 404 }
        )
      }

      console.log('🔍 Existing payment method_id:', existingPayment[0].payment_method_id)

      // Use the provided methodId or keep the existing one
      const finalMethodId = methodId ? parseInt(methodId) : existingPayment[0].payment_method_id

      const updateResult = await query(
        `UPDATE payments 
         SET reference_number = ?, 
             status = ?, 
             payment_method_id = ?,
             updated_at = NOW() 
         WHERE id = ? AND student_id = ?`,
        [referenceNumber, status || 'forapproval', finalMethodId, parseInt(paymentId), studentDbId]
      )

      console.log('📊 Database update result:', updateResult)

      if (updateResult.affectedRows === 0) {
        console.log('❌ No rows affected - update failed')
        return NextResponse.json(
          { success: false, error: 'Failed to update payment' },
          { status: 500 }
        )
      }

      console.log('✅ Successfully updated payment. Status:', status || 'forapproval', 'Method ID:', finalMethodId)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for approval successfully',
      paymentId: resultPaymentId,
      status: status || 'forapproval'
    })

  } catch (error) {
    console.error('❌ Update payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}