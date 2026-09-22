import { Calculator, Clock, ShieldQuestion, UserCog } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export type Screen = 'calculator' | 'fine' | 'eligibility'

export function BottomNav({
  screen,
  onChange,
  onOpenAgent,
}: {
  screen: Screen
  onChange: (s: Screen) => void
  onOpenAgent: () => void
}) {
  const { t } = useI18n()
  const items: Array<{ id: Screen | 'agent'; label: string; Icon: typeof Calculator }> = [
    { id: 'calculator', label: t('nav.calculator'), Icon: Calculator },
    { id: 'fine', label: t('nav.fine'), Icon: Clock },
    { id: 'eligibility', label: t('nav.eligibility'), Icon: ShieldQuestion },
    { id: 'agent', label: t('nav.agent'), Icon: UserCog },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur pb-safe md:hidden">
      <div className="grid h-[4.25rem] grid-cols-4">
        {items.map(({ id, label, Icon }) => {
          const active = id === screen
          return (
            <button
              key={id}
              type="button"
              onClick={() => (id === 'agent' ? onOpenAgent() : onChange(id))}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                active ? 'text-postal-600 dark:text-postal-300' : 'text-slate-500 dark:text-slate-400',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className={cn('rounded-full px-4 py-1', active && 'bg-postal-50 dark:bg-postal-950/40')}>
                <Icon size={20} />
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
