"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Attendance, DayKey, PeriodKey } from "../data/schema"
import { PERIOD_KEYS } from "../data/schema"
import { Check, X, Minus,Clock } from "lucide-react"

export const buildDailyColumns = (day: DayKey): ColumnDef<Attendance>[] => [
  {
    accessorKey: "student_name",
    header: "Student",
    cell: ({ row }) => (
      <span className={"font-medium"}>
        {row.original.student_name}
      </span>
    ),
  },

  ...PERIOD_KEYS.map((period: PeriodKey): ColumnDef<Attendance> => ({
    id: `${day}_${period}`,
    header: () => (
      <div className="text-center text-xs font-semibold">
        {period.toUpperCase()}
      </div>
    ),
    cell: ({ row }) => {
      const attendanceData = row.original.attendance?.[day]?.[period]
      
      // Handle both boolean (legacy) and string (new) formats
      const isPresent = attendanceData === true || attendanceData === "present"
      const isAbsent = attendanceData === false || attendanceData === "absent"
      const isLate = attendanceData === "late"
      const hasData = attendanceData !== undefined
      const isExcused = attendanceData === "excused"
      
      
      // If no attendance data exists for this day/period, show blank
      if (!hasData) {
        return (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Minus className="h-4 w-4" />
              <span className="text-sm font-medium">Not Recorded</span>
            </div>
          </div>
        )
      }

      // If attendance data exists, show present/absent/late
   return (
        <div className="flex justify-center">
  {isPresent ? (
    <div className="flex items-center gap-2 text-green-600">
      <Check className="h-5 w-5" />
      <span className="text-sm font-medium">Present</span>
    </div>
  ) : isLate ? (
    <div className="flex items-center gap-2 text-yellow-600">
      <Minus className="h-5 w-5" />
      <span className="text-sm font-medium">Late</span>
    </div>
  ) : isExcused ? (
    <div className="flex items-center gap-2 text-blue-600">
      <Clock className="h-5 w-5" />
      <span className="text-sm font-medium">Excused</span>
    </div>
  ) : isAbsent ? (
    <div className="flex items-center gap-2 text-red-600">
      <X className="h-5 w-5" />
      <span className="text-sm font-medium">Absent</span>
    </div>
  ) : null}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  })),
]