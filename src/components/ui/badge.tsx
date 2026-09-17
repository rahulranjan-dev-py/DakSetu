import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-postal-600 text-white',
        amber: 'border-transparent bg-gold-100 dark:bg-gold-900/40 text-gold-800 dark:text-gold-300',
        green: 'border-transparent bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200',
        red: 'border-transparent bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
        slate: 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        outline: 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
