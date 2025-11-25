"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, Plus, User, ChevronDown, Paperclip } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, UserCog } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types
type PaymentStatus = "pending" | "processing" | "completed" | "paid" | "failed" | "cancelled" | "reviewed"

interface Student {
  id: number
  student_id: string
  student_name: string
  grade: string
  section: string
  adviser: string
  status?: string
}

interface Payment {
  id: number
  student_id: number
  payment_method_id: number | null
  amount: number
  status: PaymentStatus
  reference_number: string | null
  reference_file: string | null
  description: string
  desc: string | null
  due_date: string
  paid_date: string | null
  created_at: string
  updated_at: string
  // Joined fields
  student_code?: string
  student_name?: string
  grade?: string
  section?: string
  adviser?: string
  method_name?: string
  method_code?: string
  // Add these missing properties:
  payment_method_name?: string
  payment_method_code?: string
}

// Status badge configuration
const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
  forapproval: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "For Approval" },
  processing: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Processing" },
  completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Completed" },
  paid: { color: "bg-green-100 text-green-800 border-green-200", label: "Paid" },
  failed: { color: "bg-red-100 text-red-800 border-red-200", label: "Failed" },
  cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Cancelled" },
  reviewed: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Reviewed" },
} as const

// Method badge configuration
const methodConfig = {
  gcash: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "GCash" },
  cash: { color: "bg-green-100 text-green-800 border-green-200", label: "Cash" },
  bank_transfer: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Bank Transfer" },
  'bank transfer': { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Bank Transfer" },
} as const

// Status icon function
const getStatusIcon = (status: PaymentStatus) => {
  switch (status) {
    case 'completed': 
    case 'paid': 
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending': 
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'processing': 
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'reviewed':
      return <CheckCircle className="h-4 w-4 text-purple-600" />;
    case 'failed': 
      return <XCircle className="h-4 w-4 text-red-600" />;
    default: 
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
}


// DataTablePagination Component
interface DataTablePaginationProps {
  table: ReturnType<typeof useReactTable<Payment>>
}

function DataTablePagination({ table }: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// DataTableToolbar Component
interface DataTableToolbarProps {
  table: ReturnType<typeof useReactTable<Payment>>
}

function DataTableToolbar({ table }: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, reference numbers..."
            value={(table.getColumn("student_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("student_name")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => 
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("method_name")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => 
            table.getColumn("method_name")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="GCash">GCash</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// PaymentsTable Component
interface PaymentsTableProps {
  data: Payment[]
  onViewPayment: (payment: Payment) => void
  onUpdatePaymentStatus: (paymentId: number, newStatus: PaymentStatus) => void
  loading: boolean
}

function PaymentsTable({ data, onViewPayment, onUpdatePaymentStatus, loading }: PaymentsTableProps) {
  // Enhanced columns definition
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "student_code",
      header: "Student ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.student_id}</span>
      ),
    },
    {
      accessorKey: "student_name",
      header: "Student Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.student_name || 'Unknown Student'}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.grade || 'N/A'} - {row.original.section || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "adviser",
      header: "Adviser",
      cell: ({ row }) => row.original.adviser || "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.original.amount || 0;
        return (
          <div className="font-medium">₱{amount.toLocaleString()}</div>
        );
      },
    },
    {
      accessorKey: "method_name",
      header: "Method",
      cell: ({ row }) => {
        const methodCode = (row.original.method_code || '').toLowerCase();
         const methodName = row.original.method_name || 'Unknown';
        
        const config = methodConfig[methodCode as keyof typeof methodConfig] || 
                       methodConfig[methodName.toLowerCase() as keyof typeof methodConfig] || 
                       { 
                         color: "bg-gray-100 text-gray-800 border-gray-200", 
                         label: methodName 
                       };
        
        return (
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
      const status = row.original.status || 'pending';
        const config = statusConfig[status] || { 
          color: "bg-gray-100 text-gray-800 border-gray-200", 
          label: status.charAt(0).toUpperCase() + status.slice(1) 
        };
        
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.reference_number || "-"}
        </span>
      ),
    },
    {
      accessorKey: "desc",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.desc || ""}>
          {row.original.desc || "-"}
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payment = row.original

        const handleView = () => {
          onViewPayment(payment)
        }

        const handleStatusUpdate = (newStatus: PaymentStatus) => {
          onUpdatePaymentStatus(payment.id, newStatus)
        }

        const getAvailableActions = () => {
          const status = payment.status || 'pending';
          
          switch (status) {
            case 'pending':
              return [
                { label: "Mark as Reviewed", status: "reviewed" as PaymentStatus, variant: "default" as const },
                { label: "Mark as Paid", status: "paid" as PaymentStatus, variant: "default" as const },
                { label: "Reject", status: "failed" as PaymentStatus, variant: "destructive" as const },
              ]
            case 'reviewed':
              return [
                { label: "Mark as Paid", status: "paid" as PaymentStatus, variant: "default" as const },
                { label: "Mark as Processing", status: "processing" as PaymentStatus, variant: "default" as const },
                { label: "Reject", status: "failed" as PaymentStatus, variant: "destructive" as const },
              ]
            case 'processing':
              return [
                { label: "Mark as Paid", status: "paid" as PaymentStatus, variant: "default" as const },
                { label: "Mark as Reviewed", status: "reviewed" as PaymentStatus, variant: "default" as const },
                { label: "Reject", status: "failed" as PaymentStatus, variant: "destructive" as const },
              ]
            case 'paid':
            case 'completed':
            case 'failed':
              return [
                { label: "Mark as Reviewed", status: "reviewed" as PaymentStatus, variant: "default" as const },
                { label: "Reset to Pending", status: "pending" as PaymentStatus, variant: "outline" as const },
              ]
            default:
              return [
                { label: "Mark as Reviewed", status: "reviewed" as PaymentStatus, variant: "default" as const },
                { label: "Mark as Paid", status: "paid" as PaymentStatus, variant: "default" as const },
                { label: "Reset to Pending", status: "pending" as PaymentStatus, variant: "outline" as const },
              ]
          }
        }

        const availableActions = getAvailableActions()
        const shouldHideActions = payment.status === 'paid' || payment.status === 'completed'

        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              onClick={handleView}
              disabled={loading}
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          
            {!shouldHideActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-8 gap-1" disabled={loading}>
                    Actions
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {availableActions.map((action) => (
                    <DropdownMenuItem 
                      key={action.status}
                      onClick={() => handleStatusUpdate(action.status)}
                      className={action.variant === "destructive" ? "text-red-600 focus:text-red-600" : ""}
                      disabled={loading}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar table={table} />
      
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}

// Main PaymentManagement Component
export function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [sections, setSections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // New payment form state - payment method removed
  const [newPayment, setNewPayment] = useState({
    student_ids: [] as number[],
    amount: "",
    description: "",
    desc: "",
    due_date: ""
  })

  // Multi-select state
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedSection, setSelectedSection] = useState<string>("all")

  // Filter students based on selected grade and section
  const filteredStudents = students.filter(student => {
    const gradeMatch = selectedGrade === "all" || student.grade === selectedGrade
    const sectionMatch = selectedSection === "all" || student.section === selectedSection
    return gradeMatch && sectionMatch
  });

  // Status color function
  const getStatusColor = (status: PaymentStatus) => {
    const actualStatus = status || 'pending';
    switch (actualStatus) {
      case 'completed': 
      case 'paid': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Update the students fetching part in your fetchData function
  const fetchData = async () => {
    setLoading(true)
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/students')
      ]);
      
      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();
      
      if (paymentsData.success) setPayments(paymentsData.data);
      if (studentsData.success) {
        setStudents(studentsData.data);
        // Extract unique grades and sections
        const uniqueGrades = Array.from(new Set(studentsData.data.map((s: Student) => s.grade))).sort() as string[];
        const uniqueSections = Array.from(new Set(studentsData.data.map((s: Student) => s.section))).sort() as string[];
        setGrades(uniqueGrades);
        setSections(uniqueSections);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Create payment function - payment method can be blank
  const createPayment = async () => {
    try {
      setLoading(true);

      // Create payment data - payment method is optional
      const paymentData = {
        student_ids: selectedStudents,
        amount: parseFloat(newPayment.amount),
        description: newPayment.description || newPayment.desc || 'Payment',
        desc: newPayment.desc,
        due_date: newPayment.due_date
        // payment_method_id is optional and can be set later
      };

      console.log('📤 Sending payment data:', paymentData);

      const response = await fetch(`/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      console.log('📨 Response:', result);

      if (result.success) {
        await fetchData();
        setIsCreateModalOpen(false);
        setNewPayment({
          student_ids: [],
          amount: "",
          description: "",
          desc: "",
          due_date: ""
        });
        setSelectedStudents([]);
        setSelectedGrade("all");
        setSelectedSection("all");
        alert(result.message || 'Payments created successfully!');
      } else {
        alert('Failed to create payment: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Update payment status
  const updatePaymentStatus = async (paymentId: number, newStatus: PaymentStatus) => {
    try {
      console.log('🔄 Starting updatePaymentStatus for payment:', paymentId, 'to status:', newStatus);
      
      setActionLoading(paymentId);
      
        const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📦 API response with UPDATED DATA:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Payment status updated successfully');
      await fetchData();
      
      setIsViewModalOpen(false);
      alert(result.message || 'Payment status updated successfully!');
      
    } catch (error) {
      console.error('💥 Error updating payment:', error);
      alert(`Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  }

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }

  const selectAllFilteredStudents = () => {
    setSelectedStudents(filteredStudents.map(student => student.id));
  }

  const clearAllStudents = () => {
    setSelectedStudents([]);
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">
            View and manage all student payments as Adviser
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Adviser Mode</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Payment
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            {payments.length} payments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable 
            data={payments} 
            onViewPayment={handleViewPayment}
            onUpdatePaymentStatus={updatePaymentStatus}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Create Payment Modal - Payment method selection removed */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
            <DialogDescription>
              Create new payments for selected students. Students can choose their payment method later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade and Section Filters */}
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="students">Select Students</Label>
              <div className="flex gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllFilteredStudents}>
                  Select All ({filteredStudents.length})
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllStudents}>
                  Clear All
                </Button>
              </div>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No students found for the selected grade and section.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {student.student_name} ({student.student_id}) - {student.grade}-{student.section}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedStudents.length} student(s) selected out of {filteredStudents.length} filtered
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={newPayment.due_date}
                onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Title</Label>
              <Input
                id="description"
                placeholder="Payment title (e.g., Tuition Fee for January 2024)"
                value={newPayment.description}
                onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="Detailed payment description..."
                value={newPayment.desc}
                onChange={(e) => setNewPayment({...newPayment, desc: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              setSelectedGrade("all");
              setSelectedSection("all");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={createPayment} 
              disabled={loading || selectedStudents.length === 0 || !newPayment.amount}
            >
              {loading ? "Creating..." : `Create ${selectedStudents.length} Payment(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View and manage payment status as Adviser
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                  <p className="font-medium">{selectedPayment.student_name || 'Unknown Student'}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.student_id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold text-green-600">
                    ₱{(selectedPayment.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p>{selectedPayment.method_name || 'Not selected yet'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge variant="outline" className={getStatusColor(selectedPayment.status)}>
                      {(selectedPayment.status || 'pending').charAt(0).toUpperCase() + (selectedPayment.status || 'pending').slice(1)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                  <p>{selectedPayment.due_date ? new Date(selectedPayment.due_date).toLocaleDateString() : 'Not set'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reference Number</Label>
                  <p>{selectedPayment.reference_number || 'Not provided'}</p>
                </div>

                {selectedPayment.reference_file && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Reference File</Label>
                    <div className="mt-1">
                      <a 
                        href={selectedPayment.reference_file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        <Paperclip className="h-4 w-4" />
                        View Uploaded File
                      </a>
                    </div>
                  </div>
                )}

                {selectedPayment.description && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p>{selectedPayment.description}</p>
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Update Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPayment.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'reviewed')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Mark as Reviewed"}
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'paid')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Mark as Paid"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'failed')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <XCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Reject"}
                      </Button>
                    </>
                  )}

                  {selectedPayment.status === 'reviewed' && (
                    <>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'paid')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Mark as Paid"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'pending')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <Clock className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Back to Pending"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'failed')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <XCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Reject"}
                      </Button>
                    </>
                  )}

                  {(selectedPayment.status === 'paid' || selectedPayment.status === 'completed' || selectedPayment.status === 'failed') && (
                    <>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'reviewed')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Mark as Reviewed"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updatePaymentStatus(selectedPayment.id, 'pending')}
                        disabled={actionLoading === selectedPayment.id}
                      >
                        <Clock className="h-3 w-3" />
                        {actionLoading === selectedPayment.id ? "Updating..." : "Reset to Pending"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}