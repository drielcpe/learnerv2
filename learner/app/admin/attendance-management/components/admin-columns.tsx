"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Attendance, DayKey, PeriodKey, AttendanceStatus } from "../data/schema"
import { PERIOD_KEYS } from "../data/schema"
import { Check, X, Clock, MoreHorizontal, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const statusConfig = {
  present: { 
    icon: Check, 
    color: "text-green-600", 
    bg: "bg-green-50", 
    border: "border-green-200", 
    label: "Present" 
  },
  absent: { 
    icon: X, 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-200", 
    label: "Absent" 
  },
  late: { 
    icon: Clock, 
    color: "text-yellow-600", 
    bg: "bg-yellow-50", 
    border: "border-yellow-200", 
    label: "Late" 
  },
  excused: { 
    icon: Shield, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200", 
    label: "Excused" 
  }
} as const

// Define the meta interface for type safety
interface AttendanceTableMeta {
  updateAttendance?: (
    studentId: number,
    day: DayKey,
    period: PeriodKey,
    status: AttendanceStatus
  ) => Promise<void>
}

export const buildAdminColumns = (day: DayKey, isEditable: boolean): ColumnDef<Attendance>[] => [
  {
    accessorKey: "student_id",
    header: "Student ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.student_id}
      </span>
    ),
  },
  {
    accessorKey: "student_name",
    header: "Student Name",
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.student_name}</span>
        {(row.original.grade || row.original.section) && (
          <p className="text-xs text-muted-foreground">
            {row.original.grade} {row.original.section}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "adviser",
    header: "Adviser",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.adviser || "-"}</span>
    ),
  },

  ...PERIOD_KEYS.map((period: PeriodKey): ColumnDef<Attendance> => ({
    id: `${day}_${period}`,
    header: () => (
      <div className="text-center text-xs font-semibold">
        {period.toUpperCase()}
      </div>
    ),
    cell: ({ row, table }) => {
      const currentStatus = row.original.attendance?.[day]?.[period] as AttendanceStatus | undefined

    const handleStatusChange = async (newStatus: AttendanceStatus) => {
  console.log('🔄 Status change triggered:', {
    studentId: row.original.id,
    studentName: row.original.student_name,
    day,
    period,
    newStatus
  })

  try {
    const tableMeta = table.options.meta as AttendanceTableMeta | undefined
    
    if (!tableMeta?.updateAttendance) {
      console.error('❌ updateAttendance function not found in table meta')
      return
    }

    console.log('📞 Calling updateAttendance...')
    
    // Use the student ID directly from row.original.id
    const studentId = row.original.id
    
    if (!studentId || typeof studentId !== 'number') {
      console.error('❌ Invalid student ID:', row.original.id)
      return
    }

    await tableMeta.updateAttendance(
      studentId,
      day,
      period,
      newStatus
    )

    console.log('✅ Status change completed successfully')
  } catch (error) {
    console.error('❌ Failed to update attendance:', error)
  }
}

      // Get the current status config
      const currentConfig = currentStatus ? statusConfig[currentStatus] : null
      
      // Get the Icon component for the current status
      const StatusIcon = currentConfig?.icon || MoreHorizontal

      // Status dropdown for admin
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`w-24 justify-center ${
                  currentConfig 
                    ? `${currentConfig.bg} ${currentConfig.border}`
                    : "bg-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('🎯 Dropdown trigger clicked for period:', period)
                }}
              >
                {currentConfig ? (
                  <>
                    <StatusIcon className={`h-4 w-4 ${currentConfig.color} mr-1`} />
                    <span className={currentConfig.color}>
                      {currentConfig.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">Set Status</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('✅ Present selected for period:', period)
                  handleStatusChange("present")
                }}
                className="cursor-pointer"
              >
                <Check className="h-4 w-4 text-green-600 mr-2" />
                Present
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('⏰ Late selected for period:', period)
                  handleStatusChange("late")
                }}
                className="cursor-pointer"
              >
                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                Late
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('❌ Absent selected for period:', period)
                  handleStatusChange("absent")
                }}
                className="cursor-pointer"
              >
                <X className="h-4 w-4 text-red-600 mr-2" />
                Absent
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🛡️ Excused selected for period:', period)
                  handleStatusChange("excused")
                }}
                className="cursor-pointer"
              >
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                Excused
              </DropdownMenuItem> 
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  })),
]