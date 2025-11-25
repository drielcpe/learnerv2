"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentAttendanceClient from "./StudentAttendanceClient";
import { attendanceSchema, type Attendance } from "./data/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentData {
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  role: string;
}

async function loadStudentAttendance(studentId: string): Promise<Attendance[]> {
  try {
    const response = await fetch(`/api/student/attendance?studentId=${studentId}`);
    if (!response.ok) throw new Error(`Failed to fetch attendance: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Failed to load attendance data");
    return attendanceSchema.array().parse(result.data);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default function StudentAttendancePage() {
  const router = useRouter();
  const [data, setData] = useState<Attendance[]>([]);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = (): StudentData | null => {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) return JSON.parse(userData);

        const studentId = localStorage.getItem("studentId");
        const studentName = localStorage.getItem("studentName");
        if (!studentId || !studentName) return null;

        return {
          studentId,
          studentName,
          grade: localStorage.getItem("grade") || "",
          section: localStorage.getItem("section") || "",
          role: localStorage.getItem("userRole") || "student",
        };
      } catch {
        return null;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      const user = getUserData();
      if (!user) {
        router.replace("/login"); // Redirect if student info is missing
        return;
      }
      setStudentData(user);
      const attendanceData = await loadStudentAttendance(user.studentId);
      setData(attendanceData);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto py-6 space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between px-5">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href="/student/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </a>
          </Button>
        </div>

        {/* Title */}
        <div className="px-5">
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground mt-1">View your personal attendance records</p>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your attendance data...</p>
          </div>
        )}

        {/* Student Attendance Table */}
        {studentData && !loading && (
          <StudentAttendanceClient
            data={data}
            studentId={studentData.studentId}
            studentName={studentData.studentName}
          />
        )}

        {/* No student found */}
        {!studentData && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Student Not Found</h2>
              <p className="text-muted-foreground">Please log in to view your attendance.</p>
              <Button className="mt-4" asChild>
                <a href="/login">Go to Login</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
