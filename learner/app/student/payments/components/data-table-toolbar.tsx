"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
   globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
  grades?: string[]
  sections?: string[]
  selectedGrade?: string
  selectedSection?: string
  onGradeChange?: (value: string) => void
  onSectionChange?: (value: string) => void
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search student..."
          value={(table.getColumn("student_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("student_name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

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

      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}