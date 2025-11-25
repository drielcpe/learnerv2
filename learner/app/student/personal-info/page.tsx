"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, User,  Phone, MapPin, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"

interface StudentData {
  id: number
  student_id: string
  student_name: string
  email: string
  contact_number: string
  grade: string
  section: string
  adviser: string
  address: string
  birth_date: string
  status: string
  student_type: string
  created_at: string
  updated_at: string
}

interface UpdateData {
  email: string
  contact_number: string
  address: string
}

export default function PersonalInfoPage() {
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateData>({
    email: "",
    contact_number: "",
    address: ""
  })

  // Fetch student data after hydration
  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const studentId = localStorage.getItem("studentId") || JSON.parse(localStorage.getItem("userData") || "{}").studentId
      if (!studentId) {
        router.push("/login")
        return
      }

      const res = await fetch(`/api/student/profile?studentId=${studentId}`)
      const result = await res.json()

      if (result.success) {
        setStudentData(result.data)
        setFormData({
          email: result.data.email || "",
          contact_number: result.data.contact_number || "",
          address: result.data.address || ""
        })
      } else {
        console.error("Failed to fetch student data:", result.error)
      }
    } catch (err) {
      console.error("Error fetching student data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const studentId = localStorage.getItem("studentId") || JSON.parse(localStorage.getItem("userData") || "{}").studentId
      if (!studentId) {
        alert("Student ID not found. Please log in again.")
        router.push("/login")
        return
      }

      // Validation
      if (!formData.email.trim() || !formData.contact_number.trim() || !formData.address.trim()) {
        alert("Please fill in all required fields.")
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        alert("Please enter a valid email address")
        return
      }

      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...formData })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update profile")
      }

      alert("Profile updated successfully!")
      fetchStudentData()
    } catch (err) {
      alert(`Failed to update profile: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading student information...</span>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Student data not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/student/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personal Information</h1>
            <p className="text-muted-foreground">Manage your personal details and contact information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/student/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Your student profile (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={studentData.student_id} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Grade & Section</Label>
                <Input value={`${studentData.grade} - ${studentData.section}`} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={studentData.student_name} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Birth Date</Label>
              <Input value={studentData.birth_date ? new Date(studentData.birth_date).toLocaleDateString() : "Unknown"} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Class Adviser</Label>
              <Input value={studentData.adviser || "Not assigned"} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student Type</Label>
                <Input value={studentData.student_type || "Regular"} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={studentData.status || "Active"} readOnly className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
 
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Update your email and contact number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                Your primary email address for school communications
              </p>
            </div>
            <div className="space-y-2">
              <Label>Contact Number *</Label>
              <Input value={formData.contact_number} onChange={(e) => handleInputChange("contact_number", e.target.value)} />
                <p className="text-xs text-muted-foreground">
                Primary contact number for school communications
              </p>
            </div>
          </CardContent>
        </Card>
   </div>
        {/* Address Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>Update your residential address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Complete Address *</Label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
                          <p className="text-xs text-muted-foreground">
                Include street, barangay, city/municipality, province, and ZIP code
              </p>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Account and system details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <Input value={studentData.created_at ? new Date(studentData.created_at).toLocaleString() : "Unknown"} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input value={studentData.updated_at ? new Date(studentData.updated_at).toLocaleString() : "Unknown"} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
