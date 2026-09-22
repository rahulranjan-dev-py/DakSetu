import { useRef } from 'react'
import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import type { CalculatorController } from './state.ts'
import { PlanControls } from './PlanControls.tsx'

/** Step 2: customer name and WhatsApp number. Enter / "Done" on the keyboard moves on. */
export function CustomerCard({ c, onNext }: { c: CalculatorController; onNext?: () => void }) {
  const { t } = useI18n()
  const { state, set } = c
  const mobileRef = useRef<HTMLInputElement>(null)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <User size={14} /> {t('input.customer')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            ;(document.activeElement as HTMLElement | null)?.blur()
            onNext?.()
          }}
        >
          <div>
            <Label htmlFor="customerName">{t('input.customerName')}</Label>
            <Input
              id="customerName"
              value={state.customerName}
              placeholder={t('input.customerNamePh')}
              onChange={(e) => set('customerName', e.target.value.slice(0, 60))}
              onBlur={(e) => set('customerName', e.target.value.trim())}
              maxLength={60}
              autoComplete="off"
              enterKeyHint="next"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  mobileRef.current?.focus()
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="customerMobile">{t('input.customerMobile')}</Label>
            <Input
              ref={mobileRef}
              id="customerMobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="done"
              value={state.customerMobile}
              placeholder={t('input.customerMobilePh')}
              onChange={(e) => set('customerMobile', e.target.value.replace(/[^\d+]/g, '').slice(0, 13))}
            />
          </div>
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            {t('form.next')}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

/** Step 3: age, sum assured, term and payment mode (typed / stepped inputs only). */
export function PlanDetailsCard({ c }: { c: CalculatorController }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('input.plan')}</CardTitle>
      </CardHeader>
      <CardContent>
        <PlanControls c={c} />
      </CardContent>
    </Card>
  )
}
