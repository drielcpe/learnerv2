"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Clock, UserCheck, FileText } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardData {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  todaysAttendanceRate: number;
  pendingPayments: number;
  generatedReports: number;
  weeklyAttendance: number;
  monthlyPayments: number;
  className: string;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const response = await fetch('/api/admin/dashboard');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      return result.data
    } else {
      console.error('API returned error:', result.error)
      return null
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [userName, setUserName] = useState<string>("Administrator")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication and redirect if not admin
    if (typeof window !== 'undefined') {
      const userDataStr = localStorage.getItem('userData')
      
      if (!userDataStr) {
        // No user data found, redirect to login
        router.push('/login')
        return
      }

      try {
        const userData: UserData = JSON.parse(userDataStr)
        
        // Check if user is admin
        if (userData.role !== 'admin') {
          // Not an admin, redirect to login
          console.log('User is not admin, redirecting to login...')
          router.push('/login')
          return
        }

        // User is admin, set the name
        setUserName(userData.name || "Administrator")
        
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
        return
      }
    }

    // Fetch dashboard data
    const fetchData = async () => {
      const data = await getDashboardData()
      setDashboardData(data)
      setIsLoading(false)
    }
    
    fetchData()
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback data if API fails
  const data: DashboardData = dashboardData || {
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    todaysAttendanceRate: 0,
    pendingPayments: 0,
    generatedReports: 0,
    weeklyAttendance: 0,
    monthlyPayments: 0,
    className: 'No Class Data'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userName}! Manage your school and monitor student progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {data.className}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.presentToday}/{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students in class today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lateToday}</div>
            <p className="text-xs text-muted-foreground">
              Arrived late today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Need verification
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Management Tools</CardTitle>
            <CardDescription>
              Access school management features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start gap-2">
              <Link href="/admin/attendance-management">
                <UserCheck className="h-4 w-4" />
                Attendance Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href="/admin/student-management">
                <Users className="h-4 w-4" />
                Student Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href="/admin/payments/">
                <FileText className="h-4 w-4" />
                Payment Management
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Overview</CardTitle>
            <CardDescription>
              Current school status and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Present Today</span>
              </div>
              <span className="text-sm font-bold text-green-600">{data.presentToday} students</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Late Today</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{data.lateToday} students</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Absent Today</span>
              </div>
              <span className="text-sm font-bold text-red-600">{data.absentToday} students</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Pending Payments</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{data.pendingPayments} requests</span>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Weekly Attendance:</span>
                  <span className="font-medium">{data.weeklyAttendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payments:</span>
                  <span className="font-medium">{data.monthlyPayments}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}