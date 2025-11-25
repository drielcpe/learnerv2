export type DayKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | 
                     "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" |
                     "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31"

export type PeriodKey = "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7" | "p8"

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export interface Attendance {
  id: number
  student_id: string
  student_name: string
  grade: string
  section: string
  adviser: string
  attendance: {
    [day in DayKey]?: {
      [period in PeriodKey]?: AttendanceStatus
    }
  }
  month_year: string
}

export const DAY_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]

export const PERIOD_KEYS: PeriodKey[] = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]