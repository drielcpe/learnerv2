
"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from '@/components/ProtectedRoute'
import PaymentsClient from "./PaymentsClient"
import { paymentSchema , type Payment} from "./data/schema"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react"

interface StudentData {
  studentId: string
  studentName: string
  grade: string
  section: string
  role: string
}

async function loadStudentPayments(studentId: string) {
  try {
    const response = await fetch(`/api/student/payments?studentId=${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load payment data')
    }

    // Validate data with your schema
    return paymentSchema.array().parse(result.data)
  } catch (error) {
    console.error('Error loading student payments:', error)
    return []
  }
}
export default function StudentPaymentsPage() {
 const [data, setData] = useState<Payment[]>([])
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get student data from localStorage
   const getUserData = (): StudentData | null => {
  try {
    const userDataStr = localStorage.getItem('userData')
    if (userDataStr) {
      return JSON.parse(userDataStr) as StudentData
    }

    const studentId = localStorage.getItem('studentId')
    const studentName = localStorage.getItem('studentName')
    const userRole = localStorage.getItem('userRole')

    if (studentId && studentName) {
      return {
        studentId,
        studentName,
        grade: localStorage.getItem('grade') || '',
        section: localStorage.getItem('section') || '',
        role: userRole || 'student'
      }
    }

    return null
  } catch (err) {
    console.error('Error reading from localStorage:', err)
    return null
  }
}


    const fetchData = async () => {
      try {
        setLoading(true)
        const userData = getUserData()
        
        if (!userData) {
          setError('Student data not found. Please log in again.')
          setLoading(false)
          return
        }

        setStudentData(userData)
        const paymentData = await loadStudentPayments(userData.studentId)
        setData(paymentData)
        
      } catch (err) {
        setError('Failed to load payment data')
        console.error('Error fetching payments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between m-5">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href="/student">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your payment data...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between m-5">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href="/student">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button className="mt-4" asChild>
                  <a href="/student">Return to Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  if (!studentData) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between m-5">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href="/student">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Student Not Found</h2>
                <p className="text-muted-foreground">Please log in to view your payments.</p>
                <Button className="mt-4" asChild>
                  <a href="/login">Go to Login</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between m-5">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href="/student/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Payment System</span>
          </div>
        </div>
        
        {/* Title Section */}
        <div className="m-5">
          <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your payment history and outstanding balances
          </p>
        </div>

        <PaymentsClient data={data} />
      </div>
    </ProtectedRoute>
  )
}