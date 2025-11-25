// app/api/student/payments/[id]/route.js
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const { status, studentId } = await request.json()

    if (!id || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the payment belongs to the student
    const paymentCheck = await query(
      `SELECT id FROM payments WHERE id = ? AND student_id = ?`,
      [parseInt(id), studentId]
    )

    if (paymentCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found or access denied' },
        { status: 404 }
      )
    }

    // Update payment status
    const updateResult = await query(
      `UPDATE payments 
       SET status = ?, updated_at = NOW() 
       WHERE id = ? AND student_id = ?`,
      [status, parseInt(id), studentId]
    )

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    })

  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const payments = await query(
      `SELECT * FROM payments WHERE id = ? AND student_id = ?`,
      [parseInt(id), studentId]
    )

    if (payments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payments[0]
    })

  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}