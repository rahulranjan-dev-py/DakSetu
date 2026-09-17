import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Building2, Calculator, RotateCcw, Tractor } from 'lucide-react'
import { Header } from '@/components/layout/Header.tsx'
import { BottomNav, type Screen } from '@/components/layout/BottomNav.tsx'
import { PwaBanner } from '@/components/layout/PwaBanner.tsx'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatINR } from '@/domain/format.ts'
import type { Lang, Product } from '@/domain/types.ts'
import { useI18n } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage.ts'
import { useTheme } from '@/hooks/useTheme.ts'
import { useCalculator } from '@/features/calculator/state.ts'
import { PlanPicker } from '@/features/calculator/PlanPicker.tsx'
import { InputsPanel } from '@/features/calculator/InputsPanel.tsx'
import { QuickAdjust } from '@/features/calculator/QuickAdjust.tsx'
import { ResultsDashboard } from '@/features/calculator/ResultsDashboard.tsx'
import { ErrorList } from '@/features/calculator/results/ErrorList.tsx'
import { ShareBar } from '@/features/pitch/ShareBar.tsx'
import { QuoteSheet } from '@/features/pitch/QuoteSheet.tsx'
import { elementToPdf, elementToPdfBlob } from '@/features/pitch/pdf.ts'
import { useAgentProfile } from '@/features/agent/agent.ts'
import { AgentDialog } from '@/features/agent/AgentDialog.tsx'
import { FineCalculator } from '@/features/tools/FineCalculator.tsx'
import { EligibilityChecker } from '@/features/tools/EligibilityChecker.tsx'
import { cn } from '@/lib/utils'

type Step = 'form' | 'results'

export function App() {
  const { t, l, lang } = useI18n()
  const c = useCalculator()
  const { theme, toggle: toggleTheme } = useTheme()
  const [agent, setAgent] = useAgentProfile()
  const [agentOpen, setAgentOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('calculator')
  const [step, setStep] = useLocalStorage<Step>('daksetu:step', 'form')
  const [pdfLang, setPdfLang] = useState<Lang>(lang)
  const sheetRef = useRef<HTMLDivElement>(null)

  const quoteRef = `DS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(c.result.maturity.sumAssured / 1000).padStart(4, '0')}`
  const pdfName = () => {
    const name = c.state.customerName.trim().replace(/\s+/g, '-') || 'Customer'
    return `${t('pdf.filename')}-${c.result.plan.name.en}-${name}.pdf`
  }

  const prepareSheet = useCallback(async (l: Lang) => {
    setPdfLang(l)
    // Let React commit the language change to the off-screen sheet before rasterising.
    await new Promise((r) => setTimeout(r, 60))
    if (!sheetRef.current) throw new Error('quote sheet not rendered')
    return sheetRef.current
  }, [])

  const downloadPdf = useCallback(async (l: Lang) => elementToPdf(await prepareSheet(l), pdfName()), [prepareSheet, c.state.customerName, c.result.plan.name.en, t]) // eslint-disable-line react-hooks/exhaustive-deps
  const makePdf = useCallback(
    async (l: Lang) => new File([await elementToPdfBlob(await prepareSheet(l))], pdfName(), { type: 'application/pdf' }),
    [prepareSheet, c.state.customerName, c.result.plan.name.en, t], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const calculate = () => {
    if (c.result.issues.length) return
    setStep('results')
    goTop()
  }
  const editInputs = () => {
    setStep('form')
    goTop()
  }
  const reset = () => {
    c.reset()
    setStep('form')
    goTop()
  }
  const openCalculator = (p: Product) => {
    c.setProduct(p)
    setScreen('calculator')
    setStep('form')
    goTop()
  }

  const valid = c.result.issues.length === 0
  const r = c.result

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <Header onOpenAgent={() => setAgentOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
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

        {/* ───────────── Step 1: input form ───────────── */}
        {screen === 'calculator' && step === 'form' && (
          <div className="mx-auto max-w-3xl space-y-3 pb-20 md:pb-0">
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
                      active
                        ? 'border-postal-600 bg-white shadow-card ring-1 ring-postal-600/30 dark:bg-slate-900'
                        : 'border-slate-200 bg-white/60 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-postal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-base font-extrabold leading-tight', active ? 'text-postal-700 dark:text-postal-300' : 'text-slate-700 dark:text-slate-300')}>{t(`product.${p}`)}</span>
                      <span className="block truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">{t(`product.${p}.full`)}</span>
                      <span className="hidden text-[10px] text-slate-400 sm:block">{t(`product.${p}.hint`)}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <PlanPicker product={c.state.product} planId={c.state.planId} onSelect={c.setPlan} />
            <InputsPanel c={c} />
            {!valid && <ErrorList issues={r.issues} />}

            {/* Calculate: sticky above the bottom nav on mobile, inline on desktop */}
            <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 dark:border-slate-700 dark:bg-slate-900/95 md:dark:bg-transparent">
              <div className="container md:px-0">
                <Button size="lg" className="w-full text-base md:w-auto md:min-w-64" onClick={calculate} disabled={!valid}>
                  <Calculator /> {valid ? t('form.calculate') : t('form.fixErrors')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── Step 2: results ───────────── */}
        {screen === 'calculator' && step === 'results' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('results.for')} {c.state.customerName.trim() ? `· ${c.state.customerName}` : ''}
                </div>
                <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                  {l(r.plan.name)} · {r.plan.product} · {t('common.age')} {c.anb} · {formatINR(r.maturity.sumAssured)} · {t(`mode.${c.state.paymentMode}`)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={editInputs}>
                  <ArrowLeft /> {t('results.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw /> {t('results.reset')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
              <div className="min-w-0 lg:sticky lg:top-[4.25rem]">
                <div className="hidden lg:block">
                  <QuickAdjust c={c} alwaysOpen />
                </div>
                <div className="lg:hidden">
                  <QuickAdjust c={c} />
                </div>
              </div>
              <ResultsDashboard result={r}>
                <ShareBar result={r} customerName={c.state.customerName} customerMobile={c.state.customerMobile} agent={agent} onDownloadPdf={downloadPdf} onMakePdf={makePdf} />
              </ResultsDashboard>
            </div>
          </div>
        )}

        {screen === 'fine' && <FineCalculator />}
        {screen === 'eligibility' && <EligibilityChecker onOpenCalculator={openCalculator} />}
      </main>

      <footer className="container mt-8 space-y-1 text-center text-[11px] text-slate-400">
        <p>{t('app.tagline')}</p>
        <p>
          {t('app.developedBy')}: <span className="font-semibold text-slate-500">{t('app.developer')}</span>
        </p>
      </footer>

      <BottomNav screen={screen} onChange={setScreen} onOpenAgent={() => setAgentOpen(true)} />
      <AgentDialog open={agentOpen} onOpenChange={setAgentOpen} agent={agent} onSave={setAgent} />

      {/* Off-screen quotation sheet used for PDF export (always light) */}
      {valid && (
        <div aria-hidden className="pointer-events-none fixed left-[-2000px] top-0 z-[-1]">
          <QuoteSheet ref={sheetRef} result={r} lang={pdfLang} customerName={c.state.customerName} agent={agent} quoteRef={quoteRef} />
        </div>
      )}
    </div>
  )
}
