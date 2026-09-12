import { useCallback, useRef, useState } from 'react'
import { Building2, Tractor } from 'lucide-react'
import { Header } from '@/components/layout/Header.tsx'
import { BottomNav, type Screen } from '@/components/layout/BottomNav.tsx'
import { PwaBanner } from '@/components/layout/PwaBanner.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Lang, Product } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import { useCalculator } from '@/features/calculator/state.ts'
import { PlanPicker } from '@/features/calculator/PlanPicker.tsx'
import { InputsPanel } from '@/features/calculator/InputsPanel.tsx'
import { ResultsDashboard } from '@/features/calculator/ResultsDashboard.tsx'
import { ShareBar } from '@/features/pitch/ShareBar.tsx'
import { QuoteSheet } from '@/features/pitch/QuoteSheet.tsx'
import { elementToPdf } from '@/features/pitch/pdf.ts'
import { useAgentProfile } from '@/features/agent/agent.ts'
import { AgentDialog } from '@/features/agent/AgentDialog.tsx'
import { FineCalculator } from '@/features/tools/FineCalculator.tsx'
import { EligibilityChecker } from '@/features/tools/EligibilityChecker.tsx'
import { cn } from '@/lib/utils'

export function App() {
  const { t, lang } = useI18n()
  const c = useCalculator()
  const [agent, setAgent] = useAgentProfile()
  const [agentOpen, setAgentOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('calculator')
  const [pdfLang, setPdfLang] = useState<Lang>(lang)
  const sheetRef = useRef<HTMLDivElement>(null)

  const quoteRef = `PM-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(c.result.maturity.sumAssured / 1000).padStart(4, '0')}`

  const downloadPdf = useCallback(
    async (l: Lang) => {
      setPdfLang(l)
      // Let React commit the language change to the off-screen sheet before rasterising.
      await new Promise((r) => setTimeout(r, 60))
      if (!sheetRef.current) return
      const name = c.state.customerName.trim().replace(/\s+/g, '-') || 'Customer'
      await elementToPdf(sheetRef.current, `${t('pdf.filename')}-${c.result.plan.name.en}-${name}.pdf`)
    },
    [c.state.customerName, c.result.plan.name.en, t],
  )

  const openCalculator = (p: Product) => {
    c.setProduct(p)
    setScreen('calculator')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <Header onOpenAgent={() => setAgentOpen(true)} />
      <PwaBanner />

      <main className="container mt-3">
        {/* Desktop navigation */}
        <div className="mb-3 hidden md:block">
          <Tabs value={screen} onValueChange={(v) => setScreen(v as Screen)}>
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="calculator">{t('nav.calculator')}</TabsTrigger>
              <TabsTrigger value="fine">{t('nav.fine')}</TabsTrigger>
              <TabsTrigger value="eligibility">{t('nav.eligibility')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {screen === 'calculator' && (
          <div className="space-y-3">
            {/* PLI / RPLI switch */}
            <div className="grid grid-cols-2 gap-2">
              {(['PLI', 'RPLI'] as const).map((p) => {
                const active = c.state.product === p
                const Icon = p === 'PLI' ? Building2 : Tractor
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => c.setProduct(p)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-postal-600 bg-white shadow-card ring-1 ring-postal-600/30' : 'border-slate-200 bg-white/60 hover:bg-white',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-postal-600 text-white' : 'bg-slate-100 text-slate-500')}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-base font-extrabold leading-tight', active ? 'text-postal-700' : 'text-slate-700')}>{t(`product.${p}`)}</span>
                      <span className="block truncate text-[11px] leading-tight text-slate-500">{t(`product.${p}.full`)}</span>
                      <span className="hidden text-[10px] text-slate-400 sm:block">{t(`product.${p}.hint`)}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <PlanPicker product={c.state.product} planId={c.state.planId} onSelect={c.setPlan} />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
              <div className="lg:sticky lg:top-[4.25rem]">
                <InputsPanel c={c} />
              </div>
              <ResultsDashboard result={c.result}>
                <ShareBar
                  result={c.result}
                  customerName={c.state.customerName}
                  customerMobile={c.state.customerMobile}
                  agent={agent}
                  onDownloadPdf={downloadPdf}
                />
              </ResultsDashboard>
            </div>
          </div>
        )}

        {screen === 'fine' && <FineCalculator />}
        {screen === 'eligibility' && <EligibilityChecker onOpenCalculator={openCalculator} />}
      </main>

      <footer className="container mt-8 text-center text-[11px] text-slate-400">
        {t('app.tagline')}
      </footer>

      <BottomNav screen={screen} onChange={setScreen} onOpenAgent={() => setAgentOpen(true)} />
      <AgentDialog open={agentOpen} onOpenChange={setAgentOpen} agent={agent} onSave={setAgent} />

      {/* Off-screen quotation sheet used for PDF export */}
      {c.result.issues.length === 0 && (
        <div aria-hidden className="pointer-events-none fixed left-[-2000px] top-0 z-[-1]">
          <QuoteSheet ref={sheetRef} result={c.result} lang={pdfLang} customerName={c.state.customerName} agent={agent} quoteRef={quoteRef} />
        </div>
      )}
    </div>
  )
}
