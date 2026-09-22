import { Languages, Moon, Sun, UserCog, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { useOnline } from '@/hooks/useOnline.ts'
import type { Theme } from '@/hooks/useTheme.ts'

export function Header({ onOpenAgent, theme, onToggleTheme }: { onOpenAgent: () => void; theme: Theme; onToggleTheme: () => void }) {
  const { t, toggle } = useI18n()
  const online = useOnline()
  const iconBtn = 'h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white'
  return (
    <header className="hero-gradient sticky top-0 z-40 text-white shadow-hero">
      <div className="container flex h-14 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}icons/emblem-192.png`} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-xl ring-1 ring-white/25 shadow" />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-base font-extrabold tracking-tight">{t('app.title')}</h1>
            <div className="truncate text-[11px] text-white/75">{t('app.subtitle')}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!online && (
            <span className="hidden items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold sm:flex">
              <WifiOff size={12} /> {t('app.offline')}
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-10 min-w-10 rounded-full bg-white/10 px-2.5 text-white hover:bg-white/20 hover:text-white sm:px-3" onClick={toggle} aria-label="Toggle language">
            <Languages /> <span className="hidden sm:inline">{t('lang.toggle')}</span>
          </Button>
          <Button variant="ghost" size="icon" className={iconBtn} onClick={onToggleTheme} aria-label={t('theme.toggle')} title={theme === 'dark' ? t('theme.light') : t('theme.dark')}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="icon" className={iconBtn} onClick={onOpenAgent} aria-label={t('agent.title')}>
            <UserCog />
          </Button>
        </div>
      </div>
    </header>
  )
}
