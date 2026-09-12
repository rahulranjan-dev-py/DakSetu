import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, prefix, suffix, ...props }, ref) => {
  const input = (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-base tabular shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        prefix && 'pl-8',
        suffix && 'pr-12',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
  if (!prefix && !suffix) return input
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">{prefix}</span>
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  )
})
Input.displayName = 'Input'

export { Input }
