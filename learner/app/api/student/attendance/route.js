// app/api/student/attendance/route.js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    console.log('📥 GET /api/student/attendance called with studentId:', studentId)

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student ID is required' 
        },
        { status: 400 }
      )
    }

    // Get current month_year for filtering
    const currentDate = new Date()
    const month_year = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    console.log('📅 Fetching attendance for student:', studentId, 'month:', month_year)

    // Fetch student details and their attendance
    const studentData = await query(`
      SELECT 
        s.id,
        s.student_id,
        s.student_name,
        s.grade,
        s.section,
        s.adviser,
        a.day,
        a.period,
        a.status,
        a.month_year,
        a.created_at
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.month_year = ?
      WHERE s.student_id = ? AND (s.status = 'ACTIVE' OR s.status IS NULL OR s.status = '')
      ORDER BY a.day ASC, a.period ASC
    `, [month_year, studentId])

    console.log(`✅ Found ${studentData.length} attendance records for student ${studentId}`)

    if (studentData.length === 0) {
      // Return student info even if no attendance records exist
      const studentInfo = await query(`
        SELECT 
          id,
          student_id,
          student_name,
          grade,
          section,
          adviser
        FROM students 
        WHERE student_id = ? AND (status = 'ACTIVE' OR status IS NULL OR status = '')
      `, [studentId])

      if (studentInfo.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Student not found or inactive' 
          },
          { status: 404 }
        )
      }

      const student = studentInfo[0]
      return NextResponse.json({
        success: true,
        data: [{
          id: student.id,
          student_id: student.student_id,
          student_name: student.student_name,
          grade: student.grade,
          section: student.section,
          adviser: student.adviser,
          attendance: {},
          month_year: month_year
        }]
      })
    }

    // Transform the data to match your frontend schema
    const studentMap = new Map()

    studentData.forEach(record => {
      const studentId = record.id
      
      if (!studentMap.has(studentId)) {
        // Create base student object
        studentMap.set(studentId, {
          id: record.id,
          student_id: record.student_id,
          student_name: record.student_name,
          grade: record.grade,
          section: record.section,
          adviser: record.adviser,
          attendance: {},
          month_year: month_year
        })
      }

      // Add attendance data if it exists
      const student = studentMap.get(studentId)
      if (record.day && record.period && record.status) {
        if (!student.attendance[record.day]) {
          student.attendance[record.day] = {}
        }
        student.attendance[record.day][record.period] = record.status
      }
    })

    const transformedData = Array.from(studentMap.values())
    
    console.log(`✅ Transformed ${transformedData.length} student records with attendance data`)

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('❌ Error in GET /api/student/attendance:', error)
    console.error('❌ Error details:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch student attendance data',
        details: error.message
      },
      { status: 500 }
    )
  }
}