// page.tsx
"use client"

import AdminAttendanceClient from "./AdminAttendanceClient"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserCog, Calendar } from "lucide-react"

export default function AdminAttendancePage() {
  return (
  <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </a>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Manage student attendance records - Update status and track attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Admin Mode</span>
        </div>
      </div>

      <AdminAttendanceClient />

    </div>
  )
}