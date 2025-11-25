// AdminAttendanceClient.tsx
"use client"

import { useState, useEffect } from "react"
import { buildAdminColumns } from "./components/admin-columns"
import { AttendanceDataTable } from "./components/attendance-data-table"
import type { Attendance, DayKey, PeriodKey, AttendanceStatus } from "./data/schema"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Users, Filter, Download, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { exportAttendanceToCSV, exportAttendanceToPDF } from "./utils/exportAttendance"
export default function AdminAttendanceClient() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedSection, setSelectedSection] = useState("all")



  
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export!')
      return
    }
    exportAttendanceToCSV(filteredData, selectedDate, selectedGrade, selectedSection)
  }

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      alert('No data to export!')
      return
    }
    exportAttendanceToPDF(filteredData, selectedDate, selectedGrade, selectedSection)
  }
  // Get month-year string for API calls (format: "2024-01")
  const getMonthYear = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // Get day as string (1-31)
  const getDayKey = (date: Date): DayKey => {
    return String(date.getDate()) as DayKey
  }

  // Extract unique grades and sections from data - ensure they are strings
  const grades: string[] = Array.from(new Set(
    attendanceData
      .map(item => item.grade)
      .filter((grade): grade is string => 
        typeof grade === 'string' && grade.trim() !== '' && grade !== "N/A"
      )
  ))

  const sections: string[] = Array.from(new Set(
    attendanceData
      .map(item => item.section)
      .filter((section): section is string => 
        typeof section === 'string' && section.trim() !== '' && section !== "N/A"
      )
  ))

  // Filter data based on grade and section
  const filteredData = attendanceData.filter(student => {
    const gradeMatch = selectedGrade === "all" || student.grade === selectedGrade
    const sectionMatch = selectedSection === "all" || student.section === selectedSection
    return gradeMatch && sectionMatch
  })

  useEffect(() => {
    async function loadData() {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        const monthYear = getMonthYear(selectedDate)
        console.log('📅 Loading data for month:', monthYear)
        
    const response = await fetch(`/api/adminattendance?month_year=${monthYear}`, {
  method: "GET",
  headers: { 
    "Content-Type": "application/json",
    "x-user-data": encodeURIComponent(JSON.stringify(userData))
  },
})
        const result = await response.json()

        if (result.success) {
          console.log('✅ Loaded attendance data:', result.data.length, 'students')
          setAttendanceData(result.data)
        } else {
          console.error("API error:", result.error)
        }
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedDate]) // Reload when month changes

  const handleUpdateAttendance = async (
    studentId: number,
    day: DayKey,
    period: PeriodKey,
    status: AttendanceStatus
  ) => {
    try {
      const month_year = getMonthYear(selectedDate)
      const dayKey = getDayKey(selectedDate)
      
      console.log('🔄 Updating attendance via API:', {
        studentId,
        day: dayKey,
        period,
        status,
        month_year
      })

      const response = await fetch(`/api/adminattendance/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          day: dayKey,
          period,
          status,
          month_year
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Attendance updated successfully:', result.data)
        
        setAttendanceData(prevData => 
          prevData.map(student => {
            if (student.id === studentId) {
              const updatedStudent = { ...student }
              
              if (!updatedStudent.attendance) {
                updatedStudent.attendance = {}
              }
              
              const dayKey = getDayKey(selectedDate)
              if (!updatedStudent.attendance[dayKey]) {
                updatedStudent.attendance[dayKey] = {}
              }
              
              updatedStudent.attendance[dayKey][period] = status
              
              return updatedStudent
            }
            return student
          })
        )
      } else {
        console.error('❌ Failed to update attendance:', result.error)
        throw new Error(result.error || 'Failed to update attendance')
      }
    } catch (error) {
      console.error('❌ Error updating attendance:', error)
      throw error
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students data for {format(selectedDate, 'MMMM yyyy')}...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData.length}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(selectedDate, 'MMM d')}</div>
            <p className="text-xs text-muted-foreground">{format(selectedDate, 'yyyy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grades</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">Different grades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
            <p className="text-xs text-muted-foreground">Different sections</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar & Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Date Selection & Filters
          </CardTitle>
          <CardDescription>
            Select a date and filter students to manage attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Section - Now in Popover */}
            <div className="lg:w-1/3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Select Date</h3>
                <Button
                  variant={isToday ? "default" : "outline"}
                  size="sm"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>
              
              {/* Date Picker with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    modifiers={{
                      today: new Date(),
                    }}
                    modifiersStyles={{
                      today: {
                        fontWeight: 'bold',
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">Selected Date:</div>
                <div className="text-lg font-bold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Managing attendance for this date
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grade Filter */}
                {grades.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Filter by Grade</label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="All grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {grades.map(grade => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Section Filter */}
                {sections.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Filter by Section</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="All sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map(section => (
                          <SelectItem key={section} value={section}>
                            Section {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
      
              {/* Active Filters Info */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Date: {format(selectedDate, 'MMM d, yyyy')}
                </span>
                {selectedGrade !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Grade: {selectedGrade}
                  </span>
                )}
                {selectedSection !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Section: {selectedSection}
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Students: {filteredData.length}
                </span>
                {isToday && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Today
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={filteredData.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
          
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Student Attendance - {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            Manage attendance for {format(selectedDate, 'EEEE, MMMM d, yyyy')}. Click on any period to update status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceDataTable
            data={filteredData}
            columns={buildAdminColumns(getDayKey(selectedDate), true)}
            grades={grades}
            sections={sections}
            selectedGrade={selectedGrade}
            selectedSection={selectedSection}
            onGradeChange={setSelectedGrade}
            onSectionChange={setSelectedSection}
            onUpdateAttendance={handleUpdateAttendance}
          />
        </CardContent>
      </Card>
    </div>
  )
}