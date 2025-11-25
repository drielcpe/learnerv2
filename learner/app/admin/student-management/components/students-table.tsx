// app/student-management/components/students-table.tsx
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

import { DataTablePagination } from "../../attendance-management/components/data-table-pagination"
import { DataTableToolbar } from "../../attendance-management/components/data-table-toolbar"
import type { Student } from "../data/schema"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Mail, Phone, MoreHorizontal, Save, X, UserX, UserCheck, User, Users, Download } from "lucide-react"
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

// Define custom table meta type for STUDENTS
declare module "@tanstack/react-table" {
  interface TableMeta {
    onStudentUpdate?: (studentId: string, updatedData: Partial<Student>) => void
    onStudentDeactivate?: (studentId: string) => void
    onStudentActivate?: (studentId: string) => void
    onStudentDelete?: (studentId: string) => void
    isStudentUpdating?: boolean
    showStudentActions?: boolean
  }
}

// QR Code Cell Component
const QrCodeCell = ({ row }: { row: { original: Student } }) => {
  const [imageError, setImageError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Check if QR code is valid and complete
  const isValidQrCode = React.useMemo(() => {
    const qrCode = row.original.qr_code;
    if (!qrCode) return false;
    
    // Check if it's a data URL and seems complete
    if (qrCode.startsWith('data:image/')) {
      // A complete QR code Base64 should be longer than 300 characters
      // Truncated ones will be shorter
      const isComplete = qrCode.length > 300;
      console.log(`🔍 QR Code validation:`, {
        length: qrCode.length,
        isComplete,
        preview: qrCode.substring(0, 100) + '...'
      });
      return isComplete;
    }
    
    return false;
  }, [row.original.qr_code]);

  const handleImageClick = () => {
    if (isValidQrCode && !imageError) {
      setIsModalOpen(true);
    } else {
      console.warn('⚠️ QR code is invalid or truncated, cannot display');
    }
  };

  const handleImageError = () => {
    console.error('❌ Failed to load QR code image');
    setImageError(true);
  };

  if (!isValidQrCode || imageError) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground/70">No QR</span>
          </div>
          <span className="text-xs text-muted-foreground">Invalid</span>
        </div>
      </div>
    );
  }
  const qrCodeSrc = row.original.qr_code as string;

  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center gap-1">
        <Image 
          src={qrCodeSrc} 
          alt={`QR Code for ${row.original.student_name}`}
          width={48}
          height={48}
          className="object-contain border rounded hover:scale-110 transition-transform cursor-pointer bg-white p-1"
          onClick={handleImageClick}
          onError={handleImageError}
        />
    
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Student QR Code</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded border flex justify-center">
                <Image 
                  src={qrCodeSrc} 
                  alt={`QR Code for ${row.original.student_name}`}
                  width={192}
                  height={192}
                  className="w-48 h-48"
                />
              </div>
              
              <div className="text-center mt-4">
                <p className="font-medium">{row.original.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {row.original.student_id} • Grade {row.original.grade}-{row.original.section}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => {
                    // Create a temporary anchor element to download the QR code
                    const link = document.createElement('a');
                    link.href = row.original.qr_code!;
                    link.download = `qr-code-${row.original.student_id}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Actions Cell Component
const ActionsCell = ({ row, table }: { 
  row: { original: Student }; 
  table: ReturnType<typeof useReactTable<Student>>
}) => {
  const student = row.original
  const [viewModalOpen, setViewModalOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = React.useState({
    student_name: student.student_name,
    student_type: student.student_type || 'student',
    grade: student.grade,
    section: student.section,
    adviser: student.adviser || "",
    contact_number: student.contact_number || "",
    email: student.email || "",
    address: student.address || "",
    birth_date: student.birth_date || "",
  })

  // Get meta values from table
  const showActions = table.options.meta?.showStudentActions
  const onStudentUpdate = table.options.meta?.onStudentUpdate
  const onStudentDeactivate = table.options.meta?.onStudentDeactivate
  const onStudentActivate = table.options.meta?.onStudentActivate
  const isUpdating = table.options.meta?.isStudentUpdating

  const handleSaveEdit = async () => {
    console.log('🎯 handleSaveEdit called');
    console.log('📝 Edit form data:', editForm);
    
    if (onStudentUpdate) {
      // Convert null to undefined to match the Student type
      const updateData = {
        student_name: editForm.student_name,
        student_type: editForm.student_type,
        grade: editForm.grade,
        section: editForm.section,
        adviser: editForm.adviser || undefined,
        contact_number: editForm.contact_number || undefined,
        email: editForm.email || undefined,
        address: editForm.address || undefined,
        birth_date: editForm.birth_date || undefined,
      };
      
      console.log('📤 Sending update data to parent:', updateData);
      alert('✅ Student information updated successfully!');
      // Convert ID to string to ensure type safety
      await onStudentUpdate(student.id.toString(), updateData);
      setEditModalOpen(false);
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeactivate = () => {
    if (onStudentDeactivate) {
      if (confirm('🔴 Are you sure you want to deactivate this student?')) {
        onStudentDeactivate(student.id.toString());
        alert('✅ Student deactivated successfully!');
      }
    } else {
      alert('❌ Unable to deactivate student');
    }
  }

  const handleActivate = () => {
    if (onStudentActivate) {
      if (confirm('🟢 Are you sure you want to activate this student?')) {
        onStudentActivate(student.id.toString());
        alert('✅ Student activated successfully!');
      }
    } else {
      alert('❌ Unable to activate student');
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {/* View Button - Opens Modal */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1"
          onClick={() => setViewModalOpen(true)}
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
        
        {/* Adviser actions */}
        {showActions && (
          <>
            {/* Edit Button - Opens Edit Modal */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
                
                {/* Status Actions */}
                {student.status === 'ACTIVE' ? (
                  <DropdownMenuItem onClick={handleDeactivate}>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate Student
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleActivate}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate Student
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* View Student Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Information</DialogTitle>
            <DialogDescription>
              Detailed information about {student.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                <p className="font-mono">{student.student_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p>{student.student_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="flex items-center gap-1">
                  {student.student_type === 'secretary' ? (
                    <>
                      <Users className="h-4 w-4 text-blue-600" />
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Secretary
                      </Badge>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Student
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Grade & Section</label>
                <p>Grade {student.grade} - {student.section}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Adviser</label>
                <p>{student.adviser}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                <p>{student.contact_number || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{student.email || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Birth Date</label>
                <p>{student.birth_date ? new Date(student.birth_date).toLocaleDateString() : "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enrollment Date</label>
                <p>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : "Not provided"}</p>
              </div>
            </div>
            {student.address && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p>{student.address}</p>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update the information for {student.student_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Student ID (Read-only) */}
            <div className="col-span-2">
              <Label htmlFor="student_id">Student ID</Label>
              <Input 
                id="student_id"
                value={student.student_id}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Student ID cannot be changed</p>
            </div>

            {/* Basic Information */}
            <div>
              <Label htmlFor="student_name">Full Name</Label>
              <Input 
                id="student_name"
                value={editForm.student_name}
                onChange={(e) => handleFormChange('student_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="student_type">Student Type</Label>
              <Select 
                value={editForm.student_type} 
                onValueChange={(value) => handleFormChange('student_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span>Student</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="secretary">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Secretary</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={editForm.grade} onValueChange={(value) => handleFormChange('grade', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Input 
                id="section"
                value={editForm.section}
                onChange={(e) => handleFormChange('section', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="adviser">Adviser</Label>
              <Input 
                id="adviser"
                value={editForm.adviser}
                onChange={(e) => handleFormChange('adviser', e.target.value)}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h4 className="font-medium mb-3">Contact Information</h4>
            </div>

            <div>
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input 
                id="contact_number"
                value={editForm.contact_number}
                onChange={(e) => handleFormChange('contact_number', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="student@school.edu"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address"
                value={editForm.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input 
                id="birth_date"
                type="date"
                value={editForm.birth_date}
                onChange={(e) => handleFormChange('birth_date', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "student_id",
    header: "Student ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{row.original.student_id}</span>
        {row.original.status !== 'ACTIVE' && (
          <Badge variant="outline" className="text-xs">
            {row.original.status}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "student_name",
    header: "Student Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.student_name}</div>
        <div className="text-xs text-muted-foreground">
          Grade {row.original.grade} - {row.original.section}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "student_type",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.student_type === 'secretary' ? (
          <>
            <Users className="h-3 w-3 text-blue-600" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Secretary
            </Badge>
          </>
        ) : (
          <>
            <User className="h-3 w-3 text-green-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Student
            </Badge>
          </>
        )}
      </div>
    ),
  },
  {
    accessorKey: "adviser",
    header: "Adviser",
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Phone className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.contact_number || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Mail className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.email || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "birth_date",
    header: "Birth Date",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.birth_date ? new Date(row.original.birth_date).toLocaleDateString() : "-"}
      </div>
    ),
  },
  {
    accessorKey: "enrollment_date",
    header: "Enrollment Date",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.enrollment_date ? new Date(row.original.enrollment_date).toLocaleDateString() : "-"}
      </div>
    ),
  },
  {
    accessorKey: "qr_code",
    header: "QR Code",
    cell: QrCodeCell,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
  },
]

interface StudentsTableProps {
  data: Student[]
  onStudentUpdate?: (studentId: string, updatedData: Partial<Student>) => void
  onStudentDeactivate?: (studentId: string) => void
  onStudentActivate?: (studentId: string) => void
  onStudentDelete?: (studentId: string) => void
  isUpdating?: boolean
  showActions?: boolean
}

export function StudentsTable({ 
  data, 
  onStudentUpdate,
  onStudentDeactivate,
  onStudentActivate,
  onStudentDelete,
  isUpdating = false, 
  showActions = false 
}: StudentsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      onStudentUpdate: onStudentUpdate,
      onStudentDeactivate: onStudentDeactivate,
      onStudentActivate: onStudentActivate,
      onStudentDelete: onStudentDelete,
      isStudentUpdating: isUpdating,
      showStudentActions: showActions
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar table={table} />
      
      <div className="overflow-x-auto rounded-md border">
        <ShadTable>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadTable>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}