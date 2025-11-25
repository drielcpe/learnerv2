"use client";
import { useMemo, useState } from "react"
import { PaymentsTable } from "./components/payments-table"
import type { Payment, PaymentStatus, PaymentMethod } from "./data/schema"
import { Card, CardContent} from "@/components/ui/card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  data: Payment[]
}

export default function PaymentsClient({ data }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all")
  const [adviserFilter, setAdviserFilter] = useState("all")

  // Get unique values for filters
  const advisers = useMemo(() => 
    Array.from(new Set(data.map(item => item.adviser))), 
    [data]
  )

  const statuses = useMemo(() => 
    Array.from(new Set(data.map(item => item.status))), 
    [data]
  )

  const methods = useMemo(() => 
    Array.from(new Set(data.map(item => item.payment_method))), 
    [data]
  )

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(payment => {
      const matchesSearch = payment.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           payment.student_id.toLowerCase().includes(searchQuery) ||
                           payment.reference_number?.toLowerCase().includes(searchQuery)
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter
      const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter
      const matchesAdviser = adviserFilter === "all" || payment.adviser === adviserFilter
      
      return matchesSearch && matchesStatus && matchesMethod && matchesAdviser
    })
  }, [data, searchQuery, statusFilter, methodFilter, adviserFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const total = data.length
    const pending = data.filter(p => p.status === "pending").length
    const completed = data.filter(p => p.status === "completed").length
    const totalAmount = data.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = data.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)

    return { total, pending, completed, totalAmount, pendingAmount }
  }, [data])

  const columns = useMemo(() => [], []) // We'll create this next

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              <p className="text-sm text-blue-800">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-green-800">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">₱{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-orange-800">Total Collected</p>
            </div>
          </CardContent>
        </Card>
      </div>

    
      {/* Data Table Card */}
      <Card>
        <CardContent className="p-2 m-1">
         <div className="container mx-auto py-2 space-y-2">
               <Select  value={adviserFilter} onValueChange={setAdviserFilter}>
              <SelectTrigger className="w-[120px] ">
                <SelectValue placeholder="Adviser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advisers</SelectItem>
                {advisers.map(adviser => (
                  <SelectItem key={adviser} value={adviser}>
                    {adviser}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
</div>

          <PaymentsTable  data={filteredData} />
        </CardContent>
      </Card>
    </div>
  )
}