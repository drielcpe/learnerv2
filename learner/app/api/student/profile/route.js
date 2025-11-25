import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const students = await query(
      `SELECT * FROM students WHERE student_id = ?`,
      [studentId]
    )

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: students[0]
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { studentId, contact_number, address, email } = body

    console.log('Update request received:', body)

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Only update fields that exist in your database
    const updateFields = []
    const updateValues = []

    if (contact_number !== undefined) {
      updateFields.push('contact_number = ?')
      updateValues.push(contact_number)
    }

    if (address !== undefined) {
      updateFields.push('address = ?')
      updateValues.push(address)
    }

    if (email !== undefined) {
      updateFields.push('email = ?')
      updateValues.push(email)
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()')

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    updateValues.push(studentId)

    const queryStr = `
      UPDATE students 
      SET ${updateFields.join(', ')}
      WHERE student_id = ?
    `

    console.log('Executing query:', queryStr)
    console.log('With values:', updateValues)

    const result = await query(queryStr, updateValues)

    console.log('Update result:', result)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found or no changes made' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      affectedRows: result.affectedRows
    })

  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}