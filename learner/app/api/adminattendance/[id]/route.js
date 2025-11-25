import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PUT /api/attendance/[id] - Update attendance for a specific student
export async function PUT(request, { params }) {
  try {
    // Await the params since it's now a Promise in Next.js App Router
    const { id } = await params
    
    const body = await request.json()
    const { day, period, status, month_year } = body

    console.log(`🔄 Updating attendance for student ${id}:`, {
      day,
      period,
      status,
      month_year
    })

    // Validate required fields
    if (!day || !period || !status || !month_year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: day, period, status, month_year' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: present, absent, late, or excused' },
        { status: 400 }
      )
    }

    // First, check if the student exists
    const studentExists = await query(
      'SELECT id FROM students WHERE id = ?',
      [parseInt(id)]
    )

    if (studentExists.length === 0) {
      console.error(`❌ Student ${id} not found`)
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Student ${id} exists`)

    // Check if attendance record already exists for this student, day, period, and month
    const existingRecord = await query(
      `SELECT id FROM attendance 
       WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
      [parseInt(id), day, period, month_year]
    )

    let result;
    let action = '';

    if (existingRecord.length > 0) {
      // Update existing record
      result = await query(
        `UPDATE attendance 
         SET status = ?, updated_at = NOW() 
         WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
        [status, parseInt(id), day, period, month_year]
      )
      action = 'updated'
      console.log('✅ Updated existing attendance record')
    } else {
      // Insert new record
      result = await query(
        `INSERT INTO attendance (student_id, day, period, status, month_year, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [parseInt(id), day, period, status, month_year]
      )
      action = 'created'
      console.log('✅ Created new attendance record, insertId:', result.insertId)
    }

    // Verify the record was saved by fetching it back
    const savedRecord = await query(
      `SELECT * FROM attendance 
       WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
      [parseInt(id), day, period, month_year]
    )

    console.log(`✅ Verified ${action} record:`, savedRecord[0])

    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        day,
        period,
        status,
        month_year,
        action: action,
        record: savedRecord[0],
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error updating attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}