// app/payments/student/data/schema.ts
import { z } from "zod"

export const paymentSchema = z.object({
  id: z.union([z.number(), z.string()]),
  student_id: z.string(),
  student_name: z.string(),
  grade: z.string(),
  section: z.string(),
  adviser: z.string(),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  status: z.enum(["pending","forapproval", "processing", "completed", "paid", "failed", "cancelled", "reviewed"]),
  payment_method: z.string(), // Now accepts any string from DB
  reference_number: z.union([z.string(), z.null()]),
  reference_file: z.union([z.string(), z.null()]),
  description: z.union([z.string(), z.null()]),
  due_date: z.union([z.string(), z.null()]),
  paid_date: z.union([z.string(), z.null()]),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Payment = z.infer<typeof paymentSchema>
export type PaymentStatus = Payment["status"]
export type PaymentMethod = string // Now accepts any string from DB