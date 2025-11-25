import { z } from "zod"

// Update to support present/absent/late with proper typing
export const attendanceStatusSchema = z.enum(["present", "absent", "late","excused"])
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

// Helper type for backward compatibility
export type AttendanceValue = boolean | AttendanceStatus

export const attendanceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  student_id: z.union([z.string(), z.number()]),
  student_name: z.string(),
  grade: z.string().optional(),
  section: z.string().optional(),
  adviser: z.string().optional(),
    month_year: z.string().optional(), 
  
  attendance: z.record(
    z.string(), // day
    z.record(z.string(), z.union([z.boolean(), attendanceStatusSchema])).optional() // periods with status
  ).optional().default({})
})

export type Attendance = z.infer<typeof attendanceSchema>
export type DayKey = string
export type PeriodKey = string

export const DAY_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
export const PERIOD_KEYS = ["period1", "period2", "period3", "period4", "period5"] as const