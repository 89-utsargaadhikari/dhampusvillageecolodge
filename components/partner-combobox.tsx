"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { matchesSearch } from "@/components/admin-search"

export interface PartnerOption {
  id: number | string
  name: string
  phone?: string | null
  contactPerson?: string | null
  email?: string | null
}

export function PartnerCombobox({
  partners,
  value,
  onChange,
  placeholder = "Select a business partner",
  searchPlaceholder = "Search partners...",
  emptyText = "No partners found.",
  clearLabel,
  disabled,
}: {
  partners: PartnerOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  clearLabel?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const selected = partners.find((partner) => String(partner.id) === value)
  const filtered = partners.filter((partner) =>
    matchesSearch(search, partner.name, partner.phone, partner.contactPerson, partner.email)
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal border-input dark:bg-input/30"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : value && clearLabel ? clearLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {clearLabel && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange("")
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 size-4", !value ? "opacity-100" : "opacity-0")} />
                  {clearLabel}
                </CommandItem>
              )}
              {filtered.map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={String(partner.id)}
                  onSelect={() => {
                    onChange(String(partner.id))
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === String(partner.id) ? "opacity-100" : "opacity-0")} />
                  {partner.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
