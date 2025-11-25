"use client"

import * as React from "react"
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
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { Payment, PaymentStatus } from "../data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  QrCode,
  CreditCard,
  CheckCircle,
  Wallet,
  Banknote,
  ChevronDown,
  Loader2,
  Smartphone,
  Calendar,
  User,
  FileText,
  DollarSign,
  Clock,
   AlertCircle, 
  X, 
  XCircle 
} from "lucide-react"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PaymentMethodFromDB {
  id: number
  method_code: string
  method_name: string
  description: string
  account_number: string
  account_name: string
  instructions: string
  qr_code_image: string
  is_active: boolean
}
const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending", icon: Clock, description: "Payment is pending submission" },
  forapproval: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "For Approval", icon: Clock, description: "Payment is awaiting approval" }, // use Clock or CheckCircle
  processing: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Processing", icon: Loader2, description: "Payment is being processed" },
  completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Completed", icon: CheckCircle, description: "Payment completed" },
  paid: { color: "bg-green-100 text-green-800 border-green-200", label: "Paid", icon: DollarSign, description: "Payment has been paid" },
  failed: { color: "bg-red-100 text-red-800 border-red-200", label: "Failed", icon: AlertCircle, description: "Payment failed" },
  cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Cancelled", icon: X, description: "Payment was cancelled" },
  reviewed: { color: "bg-teal-100 text-teal-800 border-teal-200", label: "Reviewed", icon: Eye, description: "Payment has been reviewed" },
  rejected: { color: "bg-red-100 text-red-800 border-red-200", label: "Rejected", icon: XCircle, description: "Payment was rejected" }
} as const;

const getMethodConfig = (methodCode: string) => {
  const configs: Record<string, { color: string; label: string }> = {
    gcash: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "GCash" },
    cash: { color: "bg-green-100 text-green-800 border-green-200", label: "Cash" },
    bank_transfer: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Bank Transfer" },
    bank: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Bank Transfer" },
    paymaya: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "PayMaya" },
    credit_card: { color: "bg-orange-100 text-orange-800 border-orange-200", label: "Credit Card" },
    debit_card: { color: "bg-teal-100 text-teal-800 border-teal-200", label: "Debit Card" },
    online: { color: "bg-pink-100 text-pink-800 border-pink-200", label: "Online" },
  }

  return configs[methodCode] || { color: "bg-gray-100 text-gray-800 border-gray-200", label: methodCode.charAt(0).toUpperCase() + methodCode.slice(1) }
}

const getMethodIcon = (methodCode: string) => {
  switch (methodCode) {
    case "gcash": return <Wallet className="h-4 w-4 text-purple-600" />
    case "paymaya": return <Smartphone className="h-4 w-4 text-indigo-600" />
    case "cash": return <Banknote className="h-4 w-4 text-green-600" />
    case "bank_transfer":
    case "bank": return <CreditCard className="h-4 w-4 text-blue-600" />
    case "credit_card": return <CreditCard className="h-4 w-4 text-orange-600" />
    case "debit_card": return <CreditCard className="h-4 w-4 text-teal-600" />
    default: return <CreditCard className="h-4 w-4 text-gray-600" />
  }
}

// -------------------- Payment Details Modal --------------------
function PaymentDetailsModal({ payment, isOpen, onClose }: { payment: Payment, isOpen: boolean, onClose: () => void }) {
  const statusConfigItem = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = statusConfigItem.icon
  const methodConfig = getMethodConfig(payment.payment_method as string)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Payment Details
          </DialogTitle>
          <DialogDescription>Detailed information about payment #{payment.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${statusConfigItem.color.replace("bg-", "bg-").replace(" text-", " ")}`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Payment Status</h3>
                <p className="text-sm text-muted-foreground">{statusConfigItem.description}</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${statusConfigItem.color}`}>{statusConfigItem.label}</Badge>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Student Information</h4>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-muted-foreground">Student ID</label><p className="font-mono">{payment.student_id}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Student Name</label><p className="font-medium">{payment.student_name}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Grade & Section</label><p>{payment.grade} - {payment.section}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Adviser</label><p>{payment.adviser}</p></div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Payment Details</h4>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-muted-foreground">Amount</label><p className="text-2xl font-bold text-green-600">₱{payment.amount.toLocaleString()}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <Badge variant="outline" className={methodConfig.color}>
                    {getMethodIcon(payment.payment_method as string)} <span className="ml-1">{methodConfig.label}</span>
                  </Badge>
                </div>
                <div><label className="text-sm font-medium text-muted-foreground">Reference Number</label>
                  <p className="font-mono">{payment.reference_number || "Not provided"}</p>
                </div>
                <div><label className="text-sm font-medium text-muted-foreground">Description</label><p>{payment.description}</p></div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Date Information</h4>
              <div className="space-y-2">
                <div><label className="text-sm font-medium text-muted-foreground">Due Date</label><p>{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "Not set"}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Paid Date</label><p>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : "Not paid"}</p></div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> System Information</h4>
              <div className="space-y-2">
                <div><label className="text-sm font-medium text-muted-foreground">Created</label><p>{payment.created_at ? new Date(payment.created_at).toLocaleString() : "Unknown"}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Last Updated</label><p>{payment.updated_at ? new Date(payment.updated_at).toLocaleString() : "Unknown"}</p></div>
              </div>
            </div>
          </div>

       

       
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -------------------- Actions Cell Component --------------------
function ActionsCell({ payment }: { payment: Payment }) {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodFromDB[]>([])
  const [loadingMethods, setLoadingMethods] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [viewModalOpen, setViewModalOpen] = React.useState(false)

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true)
      const API_BASE_URL = "https://dev.datsgedli.com/api"
      const response = await fetch(`${API_BASE_URL}/paymentmethods.php`)
      const result = await response.json()
      if (result.success) setPaymentMethods(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMethods(false)
    }
  }

const handleDropdownOpen = (open: boolean) => {
  if (open && paymentMethods.length === 0) fetchPaymentMethods()
}

  const handleView = () => setViewModalOpen(true)
      const handlePaymentMethod = async (method: PaymentMethodFromDB) => {
        try {
          console.log('🔄 Processing payment with method:', method)
          
          // For all payment methods, navigate to the payment page
          router.push(`/student/pay/${payment.id}?method=${method.method_code}&methodId=${method.id}`)
          
        } catch (error) {
          console.error('❌ Error processing payment method:', error)
          alert('❌ Error processing payment. Please try again.')
        }
      }

  const showPaymentOptions = payment.status === "pending"

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleView}>
          <Eye className="h-3 w-3" /> View
        </Button>

         {showPaymentOptions && (
              <DropdownMenu onOpenChange={handleDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-8 gap-1">
                    {loadingMethods ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        Pay Now
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                  {loadingMethods ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                    </div>
                  ) : paymentMethods.length > 0 ? (
                    <>
                      <div className="p-2 border-b">
                        <p className="text-xs font-medium text-muted-foreground">
                          Choose payment method ({paymentMethods.length} available)
                        </p>
                      </div>
                      {paymentMethods
                        .filter(method => method.is_active) // Only show active methods
                        .map((method) => (
                        <DropdownMenuItem 
                          key={method.id} 
                          onClick={() => handlePaymentMethod(method)}
                          className="p-3 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getMethodIcon(method.method_code)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-2">
                                {method.method_name}
                                {method.method_code === 'gcash' && method.qr_code_image && (
                                  <QrCode className="h-3 w-3 text-purple-500" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {method.description}
                              </div>
                              {method.account_number && (
                                <div className="text-xs font-mono text-gray-600 mt-1 truncate">
                                  {method.account_number}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-green-600 font-medium">
                                Available
                              </div>
                              {method.instructions && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Click to view instructions
                                </div>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No payment methods available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact administrator to set up payment methods
                      </p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
      </div>

      <PaymentDetailsModal payment={payment} isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} />
    </>
  )
}

// -------------------- Columns --------------------
const columns: ColumnDef<Payment>[] = [
  { accessorKey: "student_id", header: "Student ID", cell: ({ row }) => <span className="font-mono text-sm">{row.original.student_id}</span> },
  { accessorKey: "student_name", header: "Student Name", cell: ({ row }) => (
    <div>
      <div className="font-medium">{row.original.student_name}</div>
      <div className="text-xs text-muted-foreground">{row.original.grade} - {row.original.section}</div>
    </div>
  ) },
  { accessorKey: "adviser", header: "Adviser" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <div className="font-medium">₱{row.original.amount.toLocaleString()}</div> },
  { accessorKey: "payment_method", header: "Method", cell: ({ row }) => {
    const config = getMethodConfig(row.original.payment_method as string)
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }},
  { accessorKey: "status", header: "Status", cell: ({ row }) => {
    const status = row.original.status as PaymentStatus
    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800 border-gray-200", label: status.charAt(0).toUpperCase() + status.slice(1) }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }},
  { id: "actions", header: "Actions", cell: ({ row }) => <ActionsCell payment={row.original} /> },
]

// -------------------- Main Table Component --------------------
interface PaymentsTableProps {
  data: Payment[]
}

export function PaymentsTable({ data }: PaymentsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} globalFilter={globalFilter} onGlobalFilterChange={setGlobalFilter} />
      <ShadTable>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">No results found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadTable>
      <DataTablePagination table={table} />
    </div>
  )
}
