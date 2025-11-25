

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    console.log('📥 GET /api/attendance called')
    
    // Get current month_year for filtering
    const currentDate = new Date()
    const month_year = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    console.log('📅 Fetching data for month:', month_year)

    // Fetch only ACTIVE students with their attendance for the current month
    const students = await query(`
      SELECT 
        s.id,
        s.student_id,
        s.student_name,
        s.grade,
        s.section,
        s.adviser,
        a.day,
        a.period,
        a.status
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.month_year = ?
      WHERE s.status = 'ACTIVE' OR s.status IS NULL OR s.status = ''
      ORDER BY s.grade, s.section, s.student_name
    `, [month_year])

    console.log(`✅ Found ${students.length} records for active students`)

    // Transform the data to match your frontend schema
    const studentMap = new Map()

    students.forEach(record => {
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
    
    console.log(`✅ Transformed ${transformedData.length} active students with attendance data`)

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('❌ Error in GET /api/attendance:', error)
    console.error('❌ Error details:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance data',
        details: error.message
      },
      { status: 500 }
    )
  }
}