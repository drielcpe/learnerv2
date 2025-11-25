import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const currentDate = new Date()
    const month_year = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const day = String(currentDate.getDate())

    console.log('📊 Looking for attendance for day:', day, 'month:', month_year)

    // 1. Get total ACTIVE students count
    let totalStudentsResult
    try {
      // Try to get only active students
      totalStudentsResult = await query(`
        SELECT COUNT(*) as count FROM students 
        WHERE status != 'INACTIVE' OR status IS NULL OR status = ''
      `)
    } catch (error) {
      // If status column doesn't exist, get all students
      console.log('⚠️ No status column, counting all students')
      totalStudentsResult = await query('SELECT COUNT(*) as count FROM students')
    }

    
    const totalStudents = totalStudentsResult[0].count
    console.log('👥 Total ACTIVE students:', totalStudents)

    // 2. Get ACTIVE students list to compare with attendance
    let activeStudents
    try {
      activeStudents = await query(`
        SELECT id FROM students 
        WHERE status != 'INACTIVE' OR status IS NULL OR status = ''
      `)
    } catch (error) {
      activeStudents = await query('SELECT id FROM students')
    }
    
    const activeStudentIds = activeStudents.map(student => student.id)
    console.log('📋 Active student IDs:', activeStudentIds)

    // 3. Check what attendance records actually exist for ACTIVE students
    const allAttendance = await query(`
      SELECT 
        a.student_id,
        a.day,
        a.period, 
        a.status,
        a.month_year
      FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      WHERE (s.status != 'INACTIVE' OR s.status IS NULL OR s.status = '')
      ORDER BY a.created_at DESC 
      LIMIT 50
    `)

    console.log('📊 All recent attendance records for active students:', allAttendance)

    // 4. Find records for TODAY for ACTIVE students only
    const todayRecords = allAttendance.filter(record => 
      record.day === day && 
      record.month_year === month_year &&
      activeStudentIds.includes(record.student_id)
    )

    console.log('📊 Today\'s filtered records for active students:', todayRecords)

    // Count unique ACTIVE students marked today
    const studentStatus = {}
    todayRecords.forEach(record => {
      // Only count if student is active
      if (activeStudentIds.includes(record.student_id)) {
        studentStatus[record.student_id] = record.status
      }
    })

const presentToday = Object.values(studentStatus).filter(status => 
  status === 'present'
).length

const lateToday = Object.values(studentStatus).filter(status => 
  status === 'late'
).length

const absentToday = Object.values(studentStatus).filter(status => 
  status === 'absent'
).length

    const uniqueStudentsMarked = Object.keys(studentStatus).length

    console.log('🎯 Final counts for active students:', {
      totalActiveStudents: totalStudents,
      uniqueStudentsMarked,
      presentToday,
      absentToday,
      notMarked: totalStudents - uniqueStudentsMarked
    })

    // 5. Get class name from active students
    let classNameResult
    try {
      classNameResult = await query(`
        SELECT grade, section, COUNT(*) as count 
        FROM students 
        WHERE status != 'INACTIVE' OR status IS NULL OR status = ''
        GROUP BY grade, section 
        ORDER BY count DESC 
        LIMIT 1
      `)
    } catch (error) {
      classNameResult = await query(`
        SELECT grade, section, COUNT(*) as count 
        FROM students 
        GROUP BY grade, section 
        ORDER BY count DESC 
        LIMIT 1
      `)
    }

    const className = classNameResult.length > 0 
      ? `${classNameResult[0].grade} - ${classNameResult[0].section}`
      : 'All Classes'

    // 6. Get other dashboard data
    const pendingPaymentsResult = await query(`
      SELECT COUNT(*) as count FROM payments WHERE status = 'pending'
    `).catch(() => [{ count: 0 }])

    const pendingPayments = pendingPaymentsResult[0].count

    const generatedReportsResult = await query(`
      SELECT COUNT(*) as count FROM reports 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [currentDate.getMonth() + 1, currentDate.getFullYear()])
      .catch(() => [{ count: 0 }])

    const generatedReports = generatedReportsResult[0].count

const dashboardData = {
  totalStudents,
  presentToday,
  lateToday, // Add this line
  absentToday,
  todaysAttendanceRate: uniqueStudentsMarked > 0 ? Math.round(((presentToday + lateToday) / uniqueStudentsMarked) * 100) : 0,
  pendingPayments,
  generatedReports,
  weeklyAttendance: 0,
  monthlyPayments: 75,
  className
}
    console.log('✅ Final dashboard data (active students only):', dashboardData)

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: error.message
      },
      { status: 500 }
    )
  }
}