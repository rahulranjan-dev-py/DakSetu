import { useMemo, useState } from 'react'
import { ArrowRight, CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { checkEligibility, type Occupation, type Residence } from '@/domain/eligibility.ts'
import type { Product } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

const OCCUPATIONS: Occupation[] = [
  'centralGovt',
  'stateGovt',
  'psu',
  'defence',
  'bank',
  'localBody',
  'education',
  'listedCompany',
  'professional',
  'graduate',
  'selfEmployed',
  'farmer',
  'homemaker',
  'other',
]

export function EligibilityChecker({ onOpenCalculator }: { onOpenCalculator: (p: Product) => void }) {
  const { t } = useI18n()
  const [age, setAge] = useState(30)
  const [occupation, setOccupation] = useState<Occupation>('centralGovt')
  const [residence, setResidence] = useState<Residence>('urban')

  const r = useMemo(() => checkEligibility({ age, occupation, residence }), [age, occupation, residence])

  const Verdict = ({ product, ok, reason }: { product: Product; ok: boolean; reason: string }) => (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3',
        ok ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{t(`product.${product}.full`)}</div>
          <div className={cn('flex items-center gap-1 text-lg font-bold', ok ? 'text-emerald-700' : 'text-slate-500')}>
            {ok ? <CircleCheck size={18} /> : <CircleX size={18} />}
            {ok ? t('elig.eligible') : t('elig.notEligible')}
          </div>
        </div>
        {ok && (
          <Button size="sm" variant="outline" onClick={() => onOpenCalculator(product)}>
            {t('elig.next')} <ArrowRight />
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-600">{reason}</p>
    </div>
  )

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            <ShieldQuestion size={14} /> {t('elig.title')}
          </CardTitle>
          <CardDescription>{t('elig.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <Label htmlFor="elig-age">{t('elig.age')}</Label>
            <Input
              id="elig-age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(Math.max(0, parseInt(e.target.value || '0', 10)))}
            />
          </div>
          <div>
            <Label>{t('elig.occupation')}</Label>
            <Select
              value={occupation}
              onValueChange={(v) => setOccupation(v as Occupation)}
              options={OCCUPATIONS.map((o) => ({ value: o, label: t(`occ.${o}`) }))}
            />
          </div>
          <div>
            <Label>{t('elig.residence')}</Label>
            <Segmented
              value={residence}
              onChange={setResidence}
              options={[
                { value: 'rural', label: t('elig.rural') },
                { value: 'urban', label: t('elig.urban') },
              ]}
              columns={2}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 pt-4">
          <Verdict
            product="PLI"
            ok={r.pli}
            reason={r.pliReason === 'eligible' ? t('elig.reason.pliOk') : t(`elig.reason.${r.pliReason}`)}
          />
          <Verdict
            product="RPLI"
            ok={r.rpli}
            reason={r.rpliReason === 'eligible' ? t('elig.reason.rpliOk') : t(`elig.reason.${r.rpliReason}`)}
          />
          {r.pli && r.rpli && <p className="rounded-xl bg-gold-50 p-3 text-xs text-gold-800">{t('elig.both')}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
