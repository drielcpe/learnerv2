// app/api/attendance/[id]/route.js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Same getUserData function as above
function getUserData(request) {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie') || ''
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString())
    } catch (error) {
      return null
    }
  }
  
  const userDataHeader = request.headers.get('x-user-data')
  if (userDataHeader) {
    try {
      return JSON.parse(decodeURIComponent(userDataHeader))
    } catch (error) {
      console.log('User data header parsing failed:', error)
    }
  }
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=')
      return [name, value]
    })
  )
  
  if (cookies['user-session']) {
    try {
      return JSON.parse(decodeURIComponent(cookies['user-session']))
    } catch (error) {
      return null
    }
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return {
      studentId: "101113130039",
      studentName: "Jhanella May M. Cacho",
      grade: "7", 
      section: "Bernoulli",
      role: "secretary"
    }
  }
  
  return null
}

export async function PUT(request, { params }) {
  try {
    // Get user data
    const userData = getUserData(request)
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User data not found' },
        { status: 401 }
      )
    }

    const userRole = userData.role || userData.userRole
    let userSection = userData.section
    let userGrade = userData.grade

    // Get section and grade from database if needed
    if ((userRole === 'secretary' || userRole === 'student') && (!userSection || !userGrade) && userData.studentId) {
      const studentInfo = await query(
        'SELECT section, grade FROM students WHERE student_id = ?',
        [userData.studentId]
      )
      if (studentInfo.length > 0) {
        userSection = studentInfo[0].section
        userGrade = studentInfo[0].grade
      }
    }

    const { id } = await params
    const body = await request.json()
    const { day, period, status, month_year } = body

    console.log(`🔄 Updating attendance for student ${id}:`, {
      day, period, status, month_year, userRole, userSection, userGrade
    })

    // Validate required fields
    if (!day || !period || !status || !month_year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if student exists and get their section AND grade
    const studentData = await query(
      'SELECT id, section, grade FROM students WHERE id = ?',
      [parseInt(id)]
    )

    if (studentData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentSection = studentData[0].section
    const studentGrade = studentData[0].grade

    // Check authorization - must match BOTH section AND grade
    if ((userRole === 'secretary' || userRole === 'student') && 
        (userSection !== studentSection || userGrade !== studentGrade)) {
      console.error(`❌ User not authorized to update student from section: ${studentSection} and grade: ${studentGrade}`)
      return NextResponse.json(
        { 
          success: false, 
          error: `Not authorized to update attendance for this student. You can only manage students from section ${userSection} and grade ${userGrade}.` 
        },
        { status: 403 }
      )
    }

    console.log(`✅ Student ${id} exists in section: ${studentSection} and grade: ${studentGrade}`)

    // Rest of your existing PUT logic...
    const existingRecord = await query(
      `SELECT id FROM attendance 
       WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
      [parseInt(id), day, period, month_year]
    )

    let result, action

    if (existingRecord.length > 0) {
      result = await query(
        `UPDATE attendance SET status = ?, updated_at = NOW() 
         WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
        [status, parseInt(id), day, period, month_year]
      )
      action = 'updated'
    } else {
      result = await query(
        `INSERT INTO attendance (student_id, day, period, status, month_year, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [parseInt(id), day, period, status, month_year]
      )
      action = 'created'
    }

    const savedRecord = await query(
      `SELECT * FROM attendance 
       WHERE student_id = ? AND day = ? AND period = ? AND month_year = ?`,
      [parseInt(id), day, period, month_year]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        day, period, status, month_year,
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