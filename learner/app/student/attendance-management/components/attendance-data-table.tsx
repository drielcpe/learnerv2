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
  TableMeta,
} from "@tanstack/react-table"

import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "../components/data-table-pagination"
import { DataTableToolbar } from "../components/data-table-toolbar"
import type { Attendance, DayKey, PeriodKey, AttendanceStatus } from "../data/schema"


/* ------------------ */
/* 2. Component Props */
/* ------------------ */
interface AdminDataTableProps {
  columns: ColumnDef<Attendance>[]
  data: Attendance[]
  grades?: string[]
  sections?: string[]
  selectedGrade?: string
  selectedSection?: string
  onGradeChange?: (value: string) => void
  onSectionChange?: (value: string) => void
  onUpdateAttendance: (
    studentId: number,
    day: DayKey,
    period: PeriodKey,
    status: AttendanceStatus
  ) => Promise<void>
}

/* ------------------ */
/* 3. AdminDataTable Component */
/* ------------------ */
export function AttendanceDataTable({
  columns,
  data,
  grades = [],
  sections = [],
  selectedGrade = "all",
  selectedSection = "all",
  onGradeChange,
  onSectionChange,
  onUpdateAttendance
}: AdminDataTableProps) {

  const table = useReactTable({
    data,
    columns,
    meta: { updateAttendance: onUpdateAttendance },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        grades={grades}
        sections={sections}
        selectedGrade={selectedGrade}
        selectedSection={selectedSection}
        onGradeChange={onGradeChange}
        onSectionChange={onSectionChange}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <ShadTable>
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadTable>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
