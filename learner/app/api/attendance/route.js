// app/api/attendance/route.js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

function getUserData(request) {
  // Get authorization header
  const authHeader = request.headers.get('authorization')
  
  // Get cookies
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=')
      return [name, value]
    })
  )
  
  // Check Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const userData = JSON.parse(Buffer.from(token, 'base64').toString())
      return userData
    } catch (error) {
      console.log('Token parsing failed:', error)
      return null
    }
  }
  
  // Check for user data in custom header
  const userDataHeader = request.headers.get('x-user-data')
  if (userDataHeader) {
    try {
      return JSON.parse(decodeURIComponent(userDataHeader))
    } catch (error) {
      console.log('User data header parsing failed:', error)
    }
  }
  
  // Check session cookie
  if (cookies['user-session']) {
    try {
      const sessionData = JSON.parse(decodeURIComponent(cookies['user-session']))
      return sessionData
    } catch (error) {
      console.log('Session cookie parsing failed:', error)
    }
  }
  
  // For development - you can remove this later
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Using development user data')
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

export async function GET(request) {
  try {
    console.log('📥 GET /api/attendance called')
    
    // Get user data from request
    const userData = getUserData(request)
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User data not found' },
        { status: 401 }
      )
    }

    console.log('👤 User data:', userData)

    const userRole = userData.role || userData.userRole
    const userSection = userData.section
    const userGrade = userData.grade
    
    // If user is a secretary but no section/grade found, try to get it from database
    let finalSection = userSection
    let finalGrade = userGrade
    
    if ((userRole === 'secretary' || userRole === 'student') && (!userSection || !userGrade) && userData.studentId) {
      console.log('🔍 Fetching section and grade from database for student:', userData.studentId)
      const studentInfo = await query(
        'SELECT section, grade FROM students WHERE student_id = ?',
        [userData.studentId]
      )
      
      if (studentInfo.length > 0) {
        finalSection = studentInfo[0].section
        finalGrade = studentInfo[0].grade
        console.log('✅ Found from database - Section:', finalSection, 'Grade:', finalGrade)
      }
    }

    // Get current month_year for filtering
    const currentDate = new Date()
    const month_year = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    console.log('📅 Fetching data for month:', month_year)
    console.log('🎯 User role:', userRole, 'Section:', finalSection, 'Grade:', finalGrade)

    let students = []
    let baseQuery = `
      SELECT 
        s.id,
        s.student_id,
        s.student_name,
        s.grade,
        s.section,
        s.adviser,
        s.student_type,
        a.day,
        a.period,
        a.status
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.month_year = ?
      WHERE (s.status = 'ACTIVE' OR s.status IS NULL OR s.status = '')
    `

    const queryParams = [month_year]

    // Apply section AND grade restriction for secretaries and students
    if ((userRole === 'secretary' || userRole === 'student') && finalSection && finalGrade) {
      baseQuery += ` AND s.section = ? AND s.grade = ?`
      queryParams.push(finalSection, finalGrade)
      console.log(`🔒 User restricted to section: ${finalSection} AND grade: ${finalGrade}`)
    } else if ((userRole === 'secretary' || userRole === 'student') && (!finalSection || !finalGrade)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not assigned to any section/grade. Please contact administrator.' 
        },
        { status: 403 }
      )
    }

    // Admins can see all sections and grades
    baseQuery += ' ORDER BY s.grade, s.section, s.student_name'
    
    students = await query(baseQuery, queryParams)

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
          student_type: record.student_type,
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
    console.log(`📊 Sections represented:`, [...new Set(transformedData.map(s => s.section))])
    console.log(`📊 Grades represented:`, [...new Set(transformedData.map(s => s.grade))])

    return NextResponse.json({
      success: true,
      data: transformedData,
      user_role: userRole,
      assigned_section: finalSection,
      assigned_grade: finalGrade,
      restricted: (userRole === 'secretary' || userRole === 'student')
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