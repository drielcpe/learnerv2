// app/api/student/dashboard/route.js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    console.log('📥 GET /api/student/dashboard called with studentId:', studentId)

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student ID is required' 
        },
        { status: 400 }
      )
    }

    // Get current month and today's date
    const currentDate = new Date()
    const month_year = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const today = String(currentDate.getDate()).padStart(2, '0')
    
    console.log('📅 Fetching dashboard data for student:', studentId, 'month:', month_year, 'today:', today)

    // 1. Get student basic info
    const studentInfo = await query(`
      SELECT 
        id,
        student_id,
        student_name,
        grade,
        section,
        adviser,
        contact_number,
        email,
        address,
        birth_date,
        status
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

    // 2. Get today's attendance status and period counts
    const todayAttendance = await query(`
      SELECT 
        period,
        status
      FROM attendance 
      WHERE student_id = ? AND month_year = ? AND day = ?
      ORDER BY period
    `, [student.id, month_year, today])

    // Calculate today's period statistics
    let todaysStatus = "No Data"
    let todaysPresent = 0
    let todaysAbsent = 0
    let todaysLate = 0
    let totalPeriodsToday = todayAttendance.length

    if (totalPeriodsToday > 0) {
      todayAttendance.forEach(record => {
        if (record.status === 'present') todaysPresent++
        if (record.status === 'absent') todaysAbsent++
        if (record.status === 'late') todaysLate++
      })

      if (todaysAbsent === totalPeriodsToday) {
        todaysStatus = "Absent"
      } else if (todaysPresent === totalPeriodsToday) {
        todaysStatus = "Present"
      } else if (todaysLate > 0) {
        todaysStatus = "Late"
      } else if (todaysPresent > 0 && todaysAbsent > 0) {
        todaysStatus = "Partially Present"
      }
    }

    // 3. Get overall attendance statistics for current month
    const monthlyAttendance = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE student_id = ? AND month_year = ?
      GROUP BY status
    `, [student.id, month_year])

    let totalPeriods = 0
    let totalPresent = 0
    let totalAbsent = 0
    let totalLate = 0

    monthlyAttendance.forEach(record => {
      totalPeriods += record.count
      if (record.status === 'present') totalPresent += record.count
      if (record.status === 'absent') totalAbsent += record.count
      if (record.status === 'late') totalLate += record.count
    })

    const overallAttendanceRate = totalPeriods > 0 ? Math.round((totalPresent / totalPeriods) * 100) : 0

    // 4. Get payment status (latest payment)
    const latestPayment = await query(`
      SELECT 
        status,
        amount,
        due_date,
        paid_date
      FROM payments 
      WHERE student_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `, [student.id])

    let paymentStatus = "No Data"
    let paymentAmount = 0
    let paymentDueDate = null

    if (latestPayment.length > 0) {
      const payment = latestPayment[0]
      paymentStatus = payment.status
      paymentAmount = payment.amount
      paymentDueDate = payment.due_date
    }

    // 5. Get recent activity (last 5 attendance records)
    const recentActivity = await query(`
      SELECT 
        day,
        period,
        status,
        created_at
      FROM attendance 
      WHERE student_id = ? AND month_year = ?
      ORDER BY created_at DESC 
      LIMIT 5
    `, [student.id, month_year])

    const formattedRecentActivity = recentActivity.map(record => ({
      day: `Day ${record.day}`,
      period: `Period ${record.period.replace('period', '')}`,
      status: record.status,
      date: record.created_at
    }))

    // 6. Emergency contact info (using student's contact as emergency for now)
    const emergencyContact = {
      name: "Parent/Guardian", // You might want to add an emergency_contact field to students table
      relationship: "Parent",
      phone: student.contact_number || "Not provided"
    }

    const dashboardData = {
      studentInfo: {
        studentId: student.student_id,
        studentName: student.student_name,
        grade: student.grade,
        section: student.section,
        adviser: student.adviser
      },
      todayStatus: {
        overall: todaysStatus,
        periods: {
          total: totalPeriodsToday,
          present: todaysPresent,
          absent: todaysAbsent,
          late: todaysLate
        }
      },
      overallAttendance: {
        rate: overallAttendanceRate,
        periods: {
          total: totalPeriods,
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate
        }
      },
      payment: {
        status: paymentStatus,
        amount: paymentAmount,
        dueDate: paymentDueDate
      },
      emergencyContact: emergencyContact,
      recentActivity: formattedRecentActivity
    }

    console.log('✅ Dashboard data fetched successfully for student:', studentId)

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('❌ Error in GET /api/student/dashboard:', error)
    console.error('❌ Error details:', error.message)
    
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