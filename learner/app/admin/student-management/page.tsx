// app/student-management/page.tsx
import StudentsClient from "./students-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserCog } from "lucide-react"

export default function StudentManagementPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Student Management System</h1>
          <p className="text-muted-foreground">
            Manage your students and their information
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Adviser Mode</span>
        </div>
      </div>

      <StudentsClient />
    </div>
  )
}