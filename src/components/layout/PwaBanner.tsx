import { CheckCircle2, Download, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt.ts'
import { useI18n } from '@/i18n'
import { useEffect, useState } from 'react'

const UPDATED_KEY = 'daksetu:updated'

export function PwaBanner() {
  const { t } = useI18n()
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const [updated, setUpdated] = useState(() => {
    try {
      return sessionStorage.getItem(UPDATED_KEY) === '1'
    } catch {
      return false
    }
  })
  // autoUpdate: the plugin reloads the page as soon as a new service worker takes
  // over, so instead of a "reload" banner we show a short confirmation afterwards.
  useRegisterSW({ immediate: true })
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const hadController = !!navigator.serviceWorker.controller
    const onChange = () => {
      if (!hadController) return // first install, not an update
      try {
        sessionStorage.setItem(UPDATED_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', onChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange)
  }, [])
  useEffect(() => {
    if (!updated) return
    try {
      sessionStorage.removeItem(UPDATED_KEY)
    } catch {
      /* ignore */
    }
    const id = setTimeout(() => setUpdated(false), 6000)
    return () => clearTimeout(id)
  }, [updated])

  if (updated) {
    return (
      <div className="container mt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200" role="status">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} /> {t('app.updated')}
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setUpdated(false)} aria-label={t('app.dismiss')}>
            <X />
          </Button>
        </div>
      </div>
    )
  }

  if (canInstall && !dismissed) {
    return (
      <div className="container mt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-postal-200 dark:border-postal-800 bg-postal-50 dark:bg-postal-950/40 px-3 py-2 text-sm text-postal-900 dark:text-postal-100">
          <span className="flex min-w-0 items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg" />
            <span className="min-w-0">
              <span className="font-semibold">{t('app.install')}</span>
              <span className="hidden sm:inline"> · {t('app.installHint')}</span>
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={install}>
              <Download /> {t('app.install')}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDismissed(true)} aria-label={t('app.dismiss')}>
              <X />
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return null
}
