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
  Table as TanTable,
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
import type { Attendance, DayKey, PeriodKey, AttendanceStatus } from "../data/schema"


const defaultDay = {
  period1: "absent" as AttendanceStatus,
  period2: "absent" as AttendanceStatus,
  period3: "absent" as AttendanceStatus,
  period4: "absent" as AttendanceStatus,
  period5: "absent" as AttendanceStatus,
}

interface DataTableProps {
  columns: ColumnDef<Attendance>[]
  data: Attendance[]
}

export function DataTable({ columns, data: initialData }: DataTableProps) {
  const [data, setData] = React.useState(initialData)

const updateAttendance = async (
  studentId: number,
  day: DayKey,
  period: PeriodKey,
  status: AttendanceStatus
): Promise<void> => {
  const rowIndex = data.findIndex(row => row.id === studentId);
  
  if (rowIndex === -1) return;

  setData((prev) =>
    prev.map((row, idx) => {
      if (idx !== rowIndex) return row

      const currentAttendance = row.attendance || {}
      const currentDay = currentAttendance[day] || {}
      
      return {
        ...row,
        attendance: {
          ...currentAttendance,
          [day]: {
            ...defaultDay,
            ...currentDay,
            [period]: status,
          },
        },
      }
    })
  )
}
const table = useReactTable<Attendance>({
  data,
  columns,
  meta: { updateAttendance },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

  return (
    <div className="flex flex-col gap-4">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadTable>
      </div>

      <DataTablePagination table={table as unknown as TanTable<Attendance>} />
    </div>
  )
}