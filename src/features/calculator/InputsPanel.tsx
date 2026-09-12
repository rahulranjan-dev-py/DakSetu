import { Cake, CalendarDays, Info, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { CONFIG, SA_PRESETS } from '@/domain/config.ts'
import { formatINR, formatShortINR } from '@/domain/format.ts'
import type { PaymentMode } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import type { CalculatorController } from './state.ts'

const MODES: PaymentMode[] = ['monthly', 'quarterly', 'halfYearly', 'yearly']

export function InputsPanel({ c }: { c: CalculatorController }) {
  const { t, lang } = useI18n()
  const { state, set, result } = c
  const plan = result.plan
  const isChild = plan.kind === 'CHILD'
  const isJoint = !!plan.joint

  const saMin = plan.minSA
  const saMax = plan.maxSA
  const presets = SA_PRESETS.filter((v) => v >= saMin && v <= saMax)

  return (
    <div className="space-y-3">
      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle>
            <User size={14} /> {t('input.customer')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName">{t('input.customerName')}</Label>
            <Input
              id="customerName"
              value={state.customerName}
              placeholder={t('input.customerNamePh')}
              onChange={(e) => set('customerName', e.target.value)}
              autoComplete="off"
            />
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

          {/* Age */}
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">{isChild ? t('input.childAge') : t('input.age')}</Label>
              <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
                {(['age', 'dob'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('ageMode', m)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 font-semibold',
                      state.ageMode === m ? 'bg-postal-600 text-white' : 'bg-white text-slate-600',
                    )}
                  >
                    {m === 'age' ? <Cake size={12} /> : <CalendarDays size={12} />}
                    {t(m === 'age' ? 'input.ageMode.age' : 'input.ageMode.dob')}
                  </button>
                ))}
              </div>
            </div>
            {state.ageMode === 'dob' ? (
              <Input
                type="date"
                value={state.dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set('dob', e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  className="w-24 text-center text-lg font-bold"
                  value={state.completedAge}
                  min={isChild ? 4 : 18}
                  max={isChild ? 19 : 60}
                  onChange={(e) => set('completedAge', clampInt(e.target.value, 0, 99))}
                />
                <Slider
                  className="flex-1"
                  min={isChild ? 4 : 18}
                  max={isChild ? 19 : 60}
                  step={1}
                  value={[state.completedAge]}
                  onValueChange={([v]) => set('completedAge', v)}
                  aria-label={t('input.age')}
                />
              </div>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Info size={12} />
              {c.dobValid ? t('input.anb', { n: c.anb }) : t('input.dob')} · {t('input.anbHint')}
            </p>
          </div>

          {isJoint && (
            <div className="sm:col-span-2">
              <Label htmlFor="spouseAge">{t('input.spouseAge')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="spouseAge"
                  type="number"
                  inputMode="numeric"
                  className="w-24 text-center text-lg font-bold"
                  value={state.spouseCompletedAge}
                  onChange={(e) => set('spouseCompletedAge', clampInt(e.target.value, 0, 99))}
                />
                <Slider
                  className="flex-1"
                  min={18}
                  max={50}
                  step={1}
                  value={[state.spouseCompletedAge]}
                  onValueChange={([v]) => set('spouseCompletedAge', v)}
                  aria-label={t('input.spouseAge')}
                />
              </div>
            </div>
          )}

          {isChild && (
            <div className="sm:col-span-2">
              <Label htmlFor="parentAge">{t('input.parentAge')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="parentAge"
                  type="number"
                  inputMode="numeric"
                  className="w-24 text-center text-lg font-bold"
                  value={state.parentCompletedAge}
                  onChange={(e) => set('parentCompletedAge', clampInt(e.target.value, 0, 99))}
                />
                <Slider
                  className="flex-1"
                  min={18}
                  max={50}
                  step={1}
                  value={[state.parentCompletedAge]}
                  onValueChange={([v]) => set('parentCompletedAge', v)}
                  aria-label={t('input.parentAge')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan parameters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('input.plan')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sum assured */}
          <div>
            <Label htmlFor="sumAssured">{t('input.sumAssured')}</Label>
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('sumAssured', v)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                    state.sumAssured === v
                      ? 'border-postal-600 bg-postal-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-postal-300',
                  )}
                >
                  {formatShortINR(v, lang)}
                </button>
              ))}
            </div>
            <Input
              id="sumAssured"
              type="number"
              inputMode="numeric"
              prefix="₹"
              className="text-lg font-bold"
              value={state.sumAssured}
              step={plan.saStep}
              min={saMin}
              max={saMax}
              onChange={(e) => set('sumAssured', clampInt(e.target.value, 0, 99_999_999))}
              onBlur={() => set('sumAssured', Math.round(state.sumAssured / plan.saStep) * plan.saStep)}
            />
            <Slider
              min={saMin}
              max={saMax}
              step={plan.saStep}
              value={[Math.min(saMax, Math.max(saMin, state.sumAssured))]}
              onValueChange={([v]) => set('sumAssured', v)}
              aria-label={t('input.sumAssured')}
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{formatINR(saMin)}</span>
              <span>{formatINR(saMax)}</span>
            </div>
          </div>

          {/* Term selector */}
          {plan.term.type === 'maturityAge' && (
            <div>
              <Label>{t('input.maturityAge')}</Label>
              <Segmented
                value={state.maturityAge}
                onChange={(v) => set('maturityAge', v)}
                options={plan.term.options.map((v) => ({
                  value: v,
                  label: String(v),
                  hint: v - c.anb >= 5 ? t('input.years', { n: v - c.anb }) : '–',
                }))}
                columns={4}
              />
            </div>
          )}
          {plan.term.type === 'ceasingAge' && (
            <div>
              <Label>{t('input.ceasingAge')}</Label>
              <Segmented
                value={state.ceasingAge}
                onChange={(v) => set('ceasingAge', v)}
                options={plan.term.options.map((v) => ({
                  value: v,
                  label: String(v),
                  hint: v - c.anb >= 5 ? t('input.years', { n: v - c.anb }) : '–',
                }))}
                columns={3}
              />
            </div>
          )}
          {plan.term.type === 'fixedTerm' && plan.term.options.length > 1 && (
            <div>
              <Label>{t('input.term')}</Label>
              <Segmented
                value={state.term}
                onChange={(v) => set('term', v)}
                options={plan.term.options.map((v) => ({
                  value: v,
                  label: t('input.years', { n: v }),
                  hint: plan.maxAgeByTerm?.[v] ? `≤ ${plan.maxAgeByTerm[v]} ${t('common.yrs')}` : undefined,
                }))}
                columns={plan.term.options.length}
              />
            </div>
          )}
          {plan.term.type === 'termRange' && (
            <div>
              <Label htmlFor="term">{t('input.term')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="term"
                  type="number"
                  inputMode="numeric"
                  className="w-24 text-center text-lg font-bold"
                  value={state.term}
                  min={plan.term.min}
                  max={plan.term.max}
                  onChange={(e) => set('term', clampInt(e.target.value, 1, 40))}
                />
                <Slider
                  className="flex-1"
                  min={plan.term.min}
                  max={plan.term.max}
                  step={1}
                  value={[state.term]}
                  onValueChange={([v]) => set('term', v)}
                  aria-label={t('input.term')}
                />
              </div>
            </div>
          )}

          {/* Convertible whole life */}
          {plan.kind === 'CWLA' && plan.conversionWindow && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>{t('input.conversion')}</Label>
                <Select
                  value={state.conversionYear}
                  onValueChange={(v) => set('conversionYear', Number(v))}
                  options={[
                    { value: 0, label: t('input.conversion.none') },
                    ...range(plan.conversionWindow.earliestYear, plan.conversionWindow.latestYear).map((y) => ({
                      value: y,
                      label: t('input.conversion.after', { n: y }),
                    })),
                  ]}
                />
              </div>
              {state.conversionYear > 0 && (
                <div>
                  <Label>{t('input.conversionMaturityAge')}</Label>
                  <Select
                    value={state.conversionMaturityAge}
                    onValueChange={(v) => set('conversionMaturityAge', Number(v))}
                    options={[50, 55, 58, 60].map((v) => ({ value: v, label: String(v) }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Payment mode */}
          <div>
            <Label>{t('input.paymentMode')}</Label>
            <Segmented
              value={state.paymentMode}
              onChange={(v) => set('paymentMode', v)}
              options={MODES.map((m) => ({
                value: m,
                label: t(`mode.${m}`),
                hint: CONFIG.modeRebate[m] ? t('mode.rebate', { pct: CONFIG.modeRebate[m] * 100 }) : undefined,
              }))}
              columns={4}
            />
          </div>

          {/* SA rebate */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">{t('input.saRebate')}</div>
              <div className="text-[11px] text-slate-500">
                {t('input.saRebateHint', {
                  amt: CONFIG.saRebate.amountPerStep,
                  step: formatINR(CONFIG.saRebate.step, { symbol: false }),
                  threshold: formatINR(CONFIG.saRebate.threshold, { symbol: false }),
                })}
              </div>
            </div>
            <Switch checked={state.applySARebate} onCheckedChange={(v) => set('applySARebate', v)} aria-label={t('input.saRebate')} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function clampInt(v: string, min: number, max: number): number {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function range(a: number, b: number): number[] {
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}
