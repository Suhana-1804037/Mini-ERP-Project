import * as React from 'react'
import { cn } from '../../lib/utils'

const Dialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DialogTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => <button {...props}>{children}</button>
const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white p-6 shadow-lg', className)}>{children}</div>
)
const DialogClose = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

export { Dialog, DialogTrigger, DialogContent, DialogClose }
