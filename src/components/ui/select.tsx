import * as React from 'react'
import { cn } from '../../lib/utils'

const SelectContext = React.createContext<{
  value?: string
  open?: boolean
  selectedLabel?: React.ReactNode
  onValueChange?: (value: string) => void
  setOpen?: (open: boolean) => void
  registerItem?: (value: string, label: React.ReactNode) => void
}>({})

const Select = ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => {
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const registerItem = React.useCallback((itemValue: string, label: React.ReactNode) => {
    setLabels((current) => {
      if (current[itemValue] === label) return current
      return { ...current, [itemValue]: label }
    })
  }, [])

  return (
    <SelectContext.Provider value={{ value, open, selectedLabel: value ? labels[value] : undefined, onValueChange, setOpen, registerItem }}>
      <div ref={ref} className="relative">{children}</div>
    </SelectContext.Provider>
  )
}
const SelectGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const SelectValue = ({ children, placeholder }: { children?: React.ReactNode; placeholder?: string }) => {
  const { selectedLabel } = React.useContext(SelectContext)
  return <span className={cn(!selectedLabel && !children && 'text-slate-400')}>{selectedLabel || children || placeholder}</span>
}
const SelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      aria-expanded={open}
      className={cn('flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm outline-none ring-offset-white focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-100', className)}
      onClick={() => setOpen?.(!open)}
    >
      {children}
      <span className="text-slate-400">v</span>
    </button>
  )
}
const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open } = React.useContext(SelectContext)
  if (!open) return null

  return <div className={cn('absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white p-2 shadow-md', className)}>{children}</div>
}
const SelectItem = ({ children, value }: { children: React.ReactNode; value?: string }) => {
  const { value: selectedValue, onValueChange, setOpen, registerItem } = React.useContext(SelectContext)

  React.useEffect(() => {
    if (value) registerItem?.(value, children)
  }, [children, registerItem, value])

  return (
    <button
      type="button"
      className={cn('block w-full rounded-sm px-2 py-1 text-left text-sm hover:bg-slate-100', selectedValue === value && 'bg-slate-100 font-medium')}
      data-value={value}
      onClick={() => {
        if (value) onValueChange?.(value)
        setOpen?.(false)
      }}
    >
      {children}
    </button>
  )
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
