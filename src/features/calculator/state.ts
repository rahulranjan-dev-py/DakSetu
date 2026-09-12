import { useCallback, useMemo, useState } from 'react'
import { PLAN_BY_ID, plansFor } from '@/domain/catalog.ts'
import { ageFromDOB, parseISODate } from '@/domain/age.ts'
import { calculate, defaultInputFor, type CalcInput, type CalcResult } from '@/domain/engine.ts'
import type { PaymentMode, PlanId, Product } from '@/domain/types.ts'
import { useLocalStorage } from '@/hooks/useLocalStorage.ts'

export type AgeMode = 'age' | 'dob'

export interface CalculatorState {
  product: Product
  planId: PlanId
  ageMode: AgeMode
  dob: string
  completedAge: number
  spouseCompletedAge: number
  parentCompletedAge: number
  sumAssured: number
  maturityAge: number
  ceasingAge: number
  term: number
  conversionYear: number
  conversionMaturityAge: number
  paymentMode: PaymentMode
  applySARebate: boolean
  nonStandardAgeProof: boolean
  customerName: string
  customerMobile: string
}

const INITIAL: CalculatorState = {
  product: 'PLI',
  planId: 'pli-santosh',
  ageMode: 'age',
  dob: '',
  completedAge: 30,
  spouseCompletedAge: 27,
  parentCompletedAge: 34,
  sumAssured: 500_000,
  maturityAge: 60,
  ceasingAge: 60,
  term: 15,
  conversionYear: 0,
  conversionMaturityAge: 60,
  paymentMode: 'monthly',
  applySARebate: true,
  nonStandardAgeProof: false,
  customerName: '',
  customerMobile: '',
}

export interface CalculatorController {
  state: CalculatorState
  set: <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => void
  patch: (p: Partial<CalculatorState>) => void
  setProduct: (p: Product) => void
  setPlan: (id: PlanId) => void
  reset: () => void
  /** Age next birthday of the life assured (child for child plans) */
  anb: number
  spouseAnb: number
  parentAnb: number
  dobValid: boolean
  input: CalcInput
  result: CalcResult
}

export function useCalculator(): CalculatorController {
  const [persisted, setPersisted] = useLocalStorage<CalculatorState>('postal-mitra:calc', INITIAL)
  const [state, setState] = useState<CalculatorState>({ ...INITIAL, ...persisted })

  const commit = useCallback(
    (updater: (prev: CalculatorState) => CalculatorState) => {
      setState((prev) => {
        const next = updater(prev)
        setPersisted(next)
        return next
      })
    },
    [setPersisted],
  )

  const set = useCallback(
    <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => commit((p) => ({ ...p, [key]: value })),
    [commit],
  )
  const patch = useCallback((p: Partial<CalculatorState>) => commit((prev) => ({ ...prev, ...p })), [commit])

  const setPlan = useCallback(
    (id: PlanId) => {
      commit((prev) => {
        const plan = PLAN_BY_ID[id]
        const isChild = plan.kind === 'CHILD'
        const wasChild = PLAN_BY_ID[prev.planId].kind === 'CHILD'
        const d = defaultInputFor(plan, {
          sumAssured: prev.sumAssured,
          maturityAge: prev.maturityAge,
          ceasingAge: prev.ceasingAge,
          term: prev.term,
          conversionYear: prev.conversionYear,
          conversionMaturityAge: prev.conversionMaturityAge,
        })
        return {
          ...prev,
          planId: id,
          product: plan.product,
          sumAssured: d.sumAssured,
          maturityAge: d.maturityAge ?? prev.maturityAge,
          ceasingAge: d.ceasingAge ?? prev.ceasingAge,
          term: d.term ?? prev.term,
          conversionYear: d.conversionYear ?? 0,
          conversionMaturityAge: d.conversionMaturityAge ?? prev.conversionMaturityAge,
          // switching between adult and child plans: reset the age to something sensible
          completedAge: isChild && !wasChild ? 9 : !isChild && wasChild ? 29 : prev.completedAge,
          ageMode: isChild !== wasChild ? 'age' : prev.ageMode,
        }
      })
    },
    [commit],
  )

  const setProduct = useCallback(
    (product: Product) => {
      const current = PLAN_BY_ID[state.planId]
      const target = plansFor(product).find((p) => p.kind === current.kind) ?? plansFor(product)[0]
      setPlan(target.id)
    },
    [setPlan, state.planId],
  )

  const reset = useCallback(() => commit(() => INITIAL), [commit])

  const dobInfo = useMemo(() => {
    if (state.ageMode !== 'dob') return null
    const d = parseISODate(state.dob)
    return d ? ageFromDOB(d) : null
  }, [state.ageMode, state.dob])

  // "Enter age" mode takes the value exactly as the Dak Sewa app does (age next
  // birthday); DOB mode derives it. Duration = maturity age − this age.
  const anb = state.ageMode === 'dob' ? (dobInfo?.nextBirthday ?? 0) : state.completedAge
  const spouseAnb = state.spouseCompletedAge
  const parentAnb = state.parentCompletedAge

  const input = useMemo<CalcInput>(
    () => ({
      planId: state.planId,
      age: anb,
      spouseAge: spouseAnb,
      parentAge: parentAnb,
      sumAssured: state.sumAssured,
      maturityAge: state.maturityAge,
      ceasingAge: state.ceasingAge,
      term: state.term,
      conversionYear: state.conversionYear,
      conversionMaturityAge: state.conversionMaturityAge,
      paymentMode: state.paymentMode,
      applySARebate: state.applySARebate,
      nonStandardAgeProof: state.nonStandardAgeProof,
    }),
    [state, anb, spouseAnb, parentAnb],
  )

  const result = useMemo(() => calculate(input), [input])

  return {
    state,
    set,
    patch,
    setProduct,
    setPlan,
    reset,
    anb,
    spouseAnb,
    parentAnb,
    dobValid: state.ageMode !== 'dob' || !!dobInfo,
    input,
    result,
  }
}
