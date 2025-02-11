'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// const frameworks = [
//   {
//     value: 'next.js',
//     label: 'Next.js',
//   },
//   {
//     value: 'sveltekit',
//     label: 'SvelteKit',
//   },
//   {
//     value: 'nuxt.js',
//     label: 'Nuxt.js',
//   },
//   {
//     value: 'remix',
//     label: 'Remix',
//   },
//   {
//     value: 'astro',
//     label: 'Astro',
//   },
// ]

export function Select({
  options,
  setValue,
  value,
}: {
  options: any[]
  setValue: any
  value: any
}) {
  const [open, setOpen] = React.useState(false)
  // const [value, setValue] = React.useState('')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between bg-zinc-700 hover:bg-zinc-600"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : 'Select client...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search client..." className="h-9" />
          <CommandList className="bg-zinc-700">
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
