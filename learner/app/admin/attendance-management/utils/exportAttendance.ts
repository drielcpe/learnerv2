// utils/exportAttendance.ts
import { Attendance, DayKey, PeriodKey, AttendanceStatus } from "../data/schema"

export const exportAttendanceToCSV = (data: Attendance[], selectedDate: Date, selectedGrade: string, selectedSection: string) => {
  const dateStr = selectedDate.toLocaleDateString()
  const gradeFilter = selectedGrade === 'all' ? 'All Grades' : `Grade ${selectedGrade}`
  const sectionFilter = selectedSection === 'all' ? 'All Sections' : `Section ${selectedSection}`
  
  // Create CSV header
  const headers = ['Student ID', 'Student Name', 'Grade', 'Section', 'Adviser', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5']
  
  // Create CSV rows
  const rows = data.map(student => {
    const dayKey = String(selectedDate.getDate()) as DayKey
    const attendance = student.attendance?.[dayKey] || {}
    
    const periods = ['period1', 'period2', 'period3', 'period4', 'period5'].map(period => {
      const status = attendance[period as PeriodKey]
      
      // Handle both boolean and string status types
      if (status === true) return 'Present'
      if (status === false) return 'Absent'
      if (typeof status === 'string') {
        return status.charAt(0).toUpperCase() + status.slice(1)
      }
      return 'Not Set'
    })
    
    return [
      student.student_id,
      student.student_name,
      student.grade || 'N/A',
      student.section || 'N/A',
      student.adviser || 'N/A',
      ...periods
    ]
  })
  
  // Combine header and rows
  const csvContent = [
    [`Attendance Report - ${dateStr}`],
    [`Grade: ${gradeFilter}, Section: ${sectionFilter}`],
    [`Total Students: ${data.length}`],
    [],
    headers,
    ...rows
  ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `attendance_${selectedDate.toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportAttendanceToPDF = async (data: Attendance[], selectedDate: Date, selectedGrade: string, selectedSection: string) => {
  // For PDF, we'll create a printable HTML table
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const gradeFilter = selectedGrade === 'all' ? 'All Grades' : `Grade ${selectedGrade}`
  const sectionFilter = selectedSection === 'all' ? 'All Sections' : `Section ${selectedSection}`
  
  // Helper function to format status
  const formatStatus = (status: boolean | AttendanceStatus | undefined): string => {
    if (status === true) return 'Present'
    if (status === false) return 'Absent'
    if (typeof status === 'string') {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }
    return 'Not Set'
  }

  // Helper function to get status class
  const getStatusClass = (status: boolean | AttendanceStatus | undefined): string => {
    if (status === true) return 'status-present'
    if (status === false) return 'status-absent'
    if (status === 'present') return 'status-present'
    if (status === 'absent') return 'status-absent'
    if (status === 'late') return 'status-late'
    if (status === 'excused') return 'status-excused'
    return ''
  }
  
  // Create HTML table
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Report - ${dateStr}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .filters { text-align: center; margin-bottom: 15px; color: #666; }
        .summary { text-align: center; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .status-present { color: green; font-weight: bold; }
        .status-absent { color: red; font-weight: bold; }
        .status-late { color: orange; font-weight: bold; }
        .status-excused { color: blue; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
        @media print {
          body { margin: 0; }
          .header { margin-bottom: 15px; }
          table { font-size: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>School Attendance Report</h1>
        <h2>${dateStr}</h2>
      </div>
      
      <div class="filters">
        <p>${gradeFilter} | ${sectionFilter}</p>
      </div>
      
      <div class="summary">
        <p>Total Students: ${data.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Grade</th>
            <th>Section</th>
            <th>Adviser</th>
            <th>Period 1</th>
            <th>Period 2</th>
            <th>Period 3</th>
            <th>Period 4</th>
            <th>Period 5</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(student => {
            const dayKey = String(selectedDate.getDate()) as DayKey
            const attendance = student.attendance?.[dayKey] || {}
            
            const periods = ['period1', 'period2', 'period3', 'period4', 'period5'].map(period => {
              const status = attendance[period as PeriodKey]
              const statusText = formatStatus(status)
              const statusClass = getStatusClass(status)
              
              return `<td class="${statusClass}">${statusText}</td>`
            }).join('')
            
            return `
              <tr>
                <td>${student.student_id}</td>
                <td>${student.student_name}</td>
                <td>${student.grade || 'N/A'}</td>
                <td>${student.section || 'N/A'}</td>
                <td>${student.adviser || 'N/A'}</td>
                ${periods}
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <script>
        // Auto-print and close after a delay
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 1000);
        }, 500);
      </script>
    </body>
    </html>
  `
  
  // Open print dialog for the HTML content
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
  }
}