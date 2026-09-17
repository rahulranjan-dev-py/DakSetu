import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import type { CalculatorController } from './state.ts'
import { PlanControls } from './PlanControls.tsx'

/** Input form: customer details + plan controls (no sliders – typed / stepped inputs only). */
export function InputsPanel({ c }: { c: CalculatorController }) {
  const { t } = useI18n()
  const { state, set } = c

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <User size={14} /> {t('input.customer')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName">{t('input.customerName')}</Label>
            <Input id="customerName" value={state.customerName} placeholder={t('input.customerNamePh')} onChange={(e) => set('customerName', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="customerMobile">{t('input.customerMobile')}</Label>
            <Input
              id="customerMobile"
              inputMode="numeric"
              value={state.customerMobile}
              placeholder={t('input.customerMobilePh')}
              onChange={(e) => set('customerMobile', e.target.value.replace(/[^\d+]/g, '').slice(0, 13))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('input.plan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanControls c={c} />
        </CardContent>
      </Card>
    </div>
  )
}
