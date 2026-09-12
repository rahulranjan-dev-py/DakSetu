import { Languages, Mail, UserCog, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { useOnline } from '@/hooks/useOnline.ts'

export function Header({ onOpenAgent }: { onOpenAgent: () => void }) {
  const { t, toggle } = useI18n()
  const online = useOnline()
  return (
    <header className="hero-gradient sticky top-0 z-40 text-white shadow-hero">
      <div className="container flex h-14 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Mail size={18} className="text-gold-300" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-extrabold tracking-tight">{t('app.title')}</div>
            <div className="truncate text-[11px] text-white/75">{t('app.subtitle')}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!online && (
            <span className="hidden items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold sm:flex">
              <WifiOff size={12} /> {t('app.offline')}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-full bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <Languages /> {t('lang.toggle')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={onOpenAgent}
            aria-label={t('agent.title')}
          >
            <UserCog />
          </Button>
        </div>
      </div>
    </header>
  )
}
