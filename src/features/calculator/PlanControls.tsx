import { Cake, CalendarDays, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { Stepper } from '@/components/ui/stepper'
import { CONFIG, SA_PRESETS } from '@/domain/config.ts'
import { jointTermRange, modeDiscount } from '@/domain/engine.ts'
import { formatINR, formatShortINR } from '@/domain/format.ts'
import type { PaymentMode } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useDraftNumber } from '@/hooks/useDraftNumber.ts'
import type { CalculatorController } from './state.ts'

const MODES: PaymentMode[] = ['monthly', 'quarterly', 'halfYearly', 'yearly']

/**
 * Age, sum assured, term, mode and rebate controls. Used on the input form and,
 * in `compact` mode, on the results page for instant what-if changes.
 */
export function PlanControls({ c, compact = false }: { c: CalculatorController; compact?: boolean }) {
  const { t, lang } = useI18n()
  const { state, set, result } = c
  const plan = result.plan
  const termRange = plan.term.type === 'termRange' ? plan.term : null
  const saDraft = useDraftNumber(
    state.sumAssured,
    (n) => set('sumAssured', Math.min(99_999_999, n)),
    (n) => Math.min(plan.maxSA, Math.max(plan.minSA, Math.round(n / plan.saStep) * plan.saStep)),
  )
  const isChild = plan.kind === 'CHILD'
  const isJoint = !!plan.joint
  const presets = SA_PRESETS.filter((v) => v >= plan.minSA && v <= plan.maxSA)

  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1')}>
      {/* Age */}
      <div className={cn('grid gap-3', isJoint || isChild ? 'sm:grid-cols-2' : '')}>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0" htmlFor="age">
              {isChild ? t('input.childAge') : t('input.age')}
            </Label>
            {!compact && (
              <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
                {(['age', 'dob'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('ageMode', m)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 font-semibold',
                      state.ageMode === m ? 'bg-postal-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300',
                    )}
                  >
                    {m === 'age' ? <Cake size={12} /> : <CalendarDays size={12} />}
                    {t(m === 'age' ? 'input.ageMode.age' : 'input.ageMode.dob')}
                  </button>
                ))}
              </div>
            )}
          </div>
          {state.ageMode === 'dob' && !compact ? (
            <Input type="date" value={state.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('dob', e.target.value)} />
          ) : (
            <Stepper
              id="age"
              value={state.ageMode === 'dob' ? c.anb : state.completedAge}
              min={isChild ? 5 : 19}
              max={isChild ? 20 : 55}
              onChange={(v) => {
                if (state.ageMode === 'dob') set('ageMode', 'age')
                set('completedAge', v)
              }}
              aria-label={t('input.age')}
            />
          )}
          {!compact && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Info size={12} />
              {state.ageMode === 'dob' ? (c.dobValid ? t('input.anb', { n: c.anb }) : t('input.dob')) : t('input.anbHint')}
            </p>
          )}
        </div>
        {isJoint && (
          <div>
            <Label htmlFor="spouseAge">{t('input.spouseAge')}</Label>
            <Stepper id="spouseAge" value={state.spouseCompletedAge} min={21} max={45} onChange={(v) => set('spouseCompletedAge', v)} aria-label={t('input.spouseAge')} />
          </div>
        )}
        {isChild && (
          <div>
            <Label htmlFor="parentAge">{t('input.parentAge')}</Label>
            <Stepper id="parentAge" value={state.parentCompletedAge} min={19} max={45} onChange={(v) => set('parentCompletedAge', v)} aria-label={t('input.parentAge')} />
          </div>
        )}
      </div>

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
                'min-h-10 shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                state.sumAssured === v
                  ? 'border-postal-600 bg-postal-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-postal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
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
          value={saDraft.text}
          step={plan.saStep}
          min={plan.minSA}
          max={plan.maxSA}
          onChange={(e) => saDraft.onChange(e.target.value)}
          onBlur={saDraft.onBlur}
          onFocus={saDraft.onFocus}
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{formatINR(plan.minSA)}</span>
          <span>{formatINR(plan.maxSA)}</span>
        </div>
      </div>

      {/* Term */}
      {plan.term.type === 'maturityAge' && (
        <div>
          <Label>{t('input.maturityAge')}</Label>
          <Segmented
            value={state.maturityAge}
            onChange={(v) => set('maturityAge', v)}
            options={plan.term.options.map((v) => ({ value: v, label: String(v), hint: v - c.anb >= 5 ? t('input.years', { n: v - c.anb }) : '–' }))}
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
            options={plan.term.options.map((v) => ({ value: v, label: String(v), hint: v - c.anb >= 5 ? t('input.years', { n: v - c.anb }) : '–' }))}
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
      {termRange && (
        <div>
          <Label htmlFor="term">{t('input.term')}</Label>
          <Select
            id="term"
            value={state.term}
            onValueChange={(v) => set('term', Number(v))}
            options={(() => {
              const r = plan.joint ? jointTermRange(c.anb, c.spouseAnb) : termRange
              const lo = Math.max(termRange.min, r.min), hi = Math.min(termRange.max, r.max)
              return Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i).map((v) => ({
                value: v,
                label: `${t('input.years', { n: v })}${plan.joint ? ` · ${t('result.maturityAge')} ${Math.round((c.anb + c.spouseAnb) / 2) + v}` : ''}`,
              }))
            })()}
          />
        </div>
      )}

      {/* Convertible whole life */}
      {plan.kind === 'CWLA' && plan.conversionWindow && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="conversionYear">{t('input.conversion')}</Label>
            <Select
              id="conversionYear"
              value={state.conversionYear}
              onValueChange={(v) => set('conversionYear', Number(v))}
              options={[
                { value: 0, label: t('input.conversion.none') },
                ...Array.from({ length: plan.conversionWindow.latestYear - plan.conversionWindow.earliestYear + 1 }, (_, i) => plan.conversionWindow!.earliestYear + i).map((y) => ({
                  value: y,
                  label: t('input.conversion.after', { n: y }),
                })),
              ]}
            />
          </div>
          {state.conversionYear > 0 && (
            <div>
              <Label htmlFor="conversionMaturityAge">{t('input.conversionMaturityAge')}</Label>
              <Select
                id="conversionMaturityAge"
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
          options={MODES.map((m) => {
            const d = m === 'monthly' ? 0 : modeDiscount(plan.product, m, result.premiumTerm, result.premium.tabularMonthly, state.sumAssured)
            const pct = Math.abs(Math.round(d * 1000) / 10)
            return { value: m, label: t(`mode.${m}`), hint: pct >= 0.1 ? t(d > 0 ? 'mode.rebate' : 'mode.loading', { pct }) : undefined }
          })}
          columns={compact ? 2 : 4}
        />
      </div>

      {!compact && (
        <>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('input.saRebate')}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('input.saRebateHint', {
                  base: CONFIG.saRebate.baseAmount,
                  minSA: formatINR(CONFIG.saRebate.minSA, { symbol: false }),
                  amt: CONFIG.saRebate.amountPerStep,
                  step: formatINR(CONFIG.saRebate.step, { symbol: false }),
                })}
              </div>
            </div>
            <Switch checked={state.applySARebate} onCheckedChange={(v) => set('applySARebate', v)} aria-label={t('input.saRebate')} />
          </div>
          {plan.product === 'RPLI' && plan.kind !== 'CHILD' && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('input.nonStdAgeProof')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('input.nonStdAgeProofHint', { pct: CONFIG.rpliNonStandardAgeProof.loading * 100, max: CONFIG.rpliNonStandardAgeProof.maxAge })}
                </div>
              </div>
              <Switch checked={state.nonStandardAgeProof} onCheckedChange={(v) => set('nonStandardAgeProof', v)} aria-label={t('input.nonStdAgeProof')} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
