"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { type Room } from "@/lib/storage"
import { picklistRoomTypes } from "@/lib/hotel"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

type Props = {
  roomTypes: Room[]
  value: string
  onChange: (roomTypeId: string) => void
  onCreate?: (name: string) => Promise<void>
  disabled?: boolean
}

export default function RoomTypeCombobox({
  roomTypes,
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const selected = roomTypes.find((type) => type.id.toString() === value)
  const options = useMemo(
    () => picklistRoomTypes(roomTypes, selected?.name),
    [roomTypes, selected?.name],
  )

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : "Select Standard Room or Deluxe Room"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.name}
                  onSelect={() => {
                    onChange(type.id.toString())
                    setOpen(false)
                  }}
                >
                  <Check className={cn("size-4", value === type.id.toString() ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{type.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
