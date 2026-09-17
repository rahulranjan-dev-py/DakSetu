import type { CalcResult } from '@/domain/engine.ts'
import { HeroCard } from './results/HeroCard.tsx'
import { BreakdownCard } from './results/BreakdownCard.tsx'
import { InvestmentChart } from './results/InvestmentChart.tsx'
import { MilestoneTimeline } from './results/MilestoneTimeline.tsx'
import { LoanCard } from './results/LoanCard.tsx'
import { ProtectionCard } from './results/ProtectionCard.tsx'
import { UnderwritingCard } from './results/UnderwritingCard.tsx'
import { YearTable } from './results/YearTable.tsx'
import { Disclaimer } from './results/Disclaimer.tsx'
import { ErrorList } from './results/ErrorList.tsx'

export function ResultsDashboard({ result, children }: { result: CalcResult; children?: React.ReactNode }) {
  if (result.issues.length) {
    return (
      <div className="space-y-3">
        <ErrorList issues={result.issues} />
        <Disclaimer />
      </div>
    )
  }
  return (
    <div className="min-w-0 space-y-3">
      <HeroCard result={result} />
      {children}
      <InvestmentChart result={result} />
      <MilestoneTimeline result={result} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        <BreakdownCard result={result} />
        <div className="space-y-3">
          <ProtectionCard result={result} />
          <LoanCard result={result} />
          <UnderwritingCard result={result} />
        </div>
      </div>
      <YearTable result={result} />
      <Disclaimer />
    </div>
  )
}
