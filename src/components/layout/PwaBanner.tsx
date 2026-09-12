import { Download, RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt.ts'
import { useI18n } from '@/i18n'
import { useState } from 'react'

export function PwaBanner() {
  const { t } = useI18n()
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  if (needRefresh) {
    return (
      <div className="container mt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gold-300 bg-gold-50 px-3 py-2 text-sm text-gold-900">
          <span className="font-semibold">{t('app.updateAvailable')}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="amber" onClick={() => updateServiceWorker(true)}>
              <RefreshCw /> {t('app.reload')}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setNeedRefresh(false)} aria-label={t('app.dismiss')}>
              <X />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (canInstall && !dismissed) {
    return (
      <div className="container mt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-postal-200 bg-postal-50 px-3 py-2 text-sm text-postal-900">
          <span>
            <span className="font-semibold">{t('app.install')}</span>
            <span className="hidden sm:inline"> · {t('app.installHint')}</span>
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
