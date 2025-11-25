// data-table-toolbar.tsx
"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "../components/data-table-view-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  grades?: string[]
  sections?: string[]
  selectedGrade?: string
  selectedSection?: string
  onGradeChange?: (value: string) => void
  onSectionChange?: (value: string) => void
}

export function DataTableToolbar<TData>({
  table,
  grades = [],
  sections = [],
  selectedGrade = "all",
  selectedSection = "all",
  onGradeChange,
  onSectionChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row - Search and Reset */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search by student name */}
          <Input
            placeholder="Search student..."
            value={(table.getColumn("student_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("student_name")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="gap-1"
            >
              Reset <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Table view options */}
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Bottom Row - Grade and Section Filters */}
      {(grades.length > 0 || sections.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {grades.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Grade:</span>
              <Select value={selectedGrade} onValueChange={onGradeChange}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sections.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Section:</span>
              <Select value={selectedSection} onValueChange={onSectionChange}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}