"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function matchesSearch(query: string, ...fields: Array<string | number | boolean | null | undefined>) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((field) => String(field ?? "").toLowerCase().includes(q))
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  )
}
