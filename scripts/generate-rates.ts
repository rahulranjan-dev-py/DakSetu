/**
 * Generates the offline premium rate tables (monthly premium per ₹1,000 SA).
 *
 *   npm run rates:generate
 *
 * Output: src/domain/rates/premium-tables.json
 *
 * Tables are keyed by product → plan kind → term-key → age-next-birthday.
 * Joint-life (Yugal Suraksha) depends on two ages and is computed on the fly by
 * the engine with the same model, so it is not tabulated.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLI_ASSUMPTIONS, RPLI_ASSUMPTIONS } from '../src/domain/actuarial/assumptions.ts'
import type { ActuarialAssumptions } from '../src/domain/actuarial/assumptions.ts'
import {
  anticipatedSpec,
  childSpec,
  endowmentSpec,
  grossMonthlyRatePer1000,
  wholeLifeSpec,
} from '../src/domain/actuarial/model.ts'
import { PLANS } from '../src/domain/catalog.ts'
import type { PlanSpec, Product } from '../src/domain/types.ts'
import { anchoredRate, endowmentByTerm, interpolateByTerm, officialSeries, roundRate } from '../src/domain/rates/official-anchors.ts'

const REF_AGE = 29

/** Scale factor from the endowment rates at the reference age, by policy term (plans with no official data). */
function endowmentTermFactor(product: Product, term: number, bonusRate: number, a: ActuarialAssumptions): number {
  const official = endowmentByTerm(product, REF_AGE)
  const ratios: Record<number, number> = {}
  for (const t of Object.keys(official).map(Number)) {
    ratios[t] = official[t] / grossMonthlyRatePer1000(endowmentSpec(REF_AGE, t, bonusRate), a)
  }
  return interpolateByTerm(ratios, term)
}

type Table = Record<string, Record<string, number>>

interface ProductTables {
  EA: Table
  WLA: Table
  AEA: Table
  CHILD: Table
}

function buildEA(plan: PlanSpec, a: ActuarialAssumptions): Table {
  const table: Table = {}
  if (plan.term.type !== 'maturityAge') return table
  for (const maturityAge of plan.term.options) {
    table[String(maturityAge)] = {}
    for (let age = plan.minAge; age <= plan.maxAge; age++) {
      const term = maturityAge - age
      if (term < 5) continue
      const modelAt = (x: number) => grossMonthlyRatePer1000(endowmentSpec(x, maturityAge - x, plan.bonusRate), a)
      table[String(maturityAge)][String(age)] =
        anchoredRate(plan.product, 'EA', maturityAge, age, modelAt) ??
        roundRate(plan.product, modelAt(age) * endowmentTermFactor(plan.product, term, plan.bonusRate, a))
    }
  }
  return table
}

function buildWLA(plan: PlanSpec, a: ActuarialAssumptions): Table {
  const table: Table = {}
  if (plan.term.type !== 'ceasingAge') return table
  for (const ceasingAge of plan.term.options) {
    table[String(ceasingAge)] = {}
    for (let age = plan.minAge; age <= plan.maxAge; age++) {
      const ppt = ceasingAge - age
      if (ppt < 5) continue
      const modelAt = (x: number) => grossMonthlyRatePer1000(wholeLifeSpec(x, ceasingAge, plan.bonusRate), a)
      table[String(ceasingAge)][String(age)] =
        anchoredRate(plan.product, 'WLA', ceasingAge, age, modelAt) ??
        roundRate(plan.product, modelAt(age) * endowmentTermFactor(plan.product, ppt, plan.bonusRate, a))
    }
  }
  return table
}

function buildAEA(plans: PlanSpec[], a: ActuarialAssumptions): Table {
  const table: Table = {}
  for (const plan of plans) {
    if (plan.term.type !== 'fixedTerm' || !plan.moneyBack) continue
    for (const term of plan.term.options) {
      const schedule = plan.moneyBack[term]
      const maxAge = plan.maxAgeByTerm?.[term] ?? plan.maxAge
      table[String(term)] = {}
      for (let age = plan.minAge; age <= maxAge; age++) {
        const modelAt = (x: number) => grossMonthlyRatePer1000(anticipatedSpec(x, term, schedule, plan.bonusRate), a)
        table[String(term)][String(age)] =
          anchoredRate(plan.product, 'AEA', term, age, modelAt) ??
          roundRate(plan.product, modelAt(age) * endowmentTermFactor(plan.product, term, plan.bonusRate, a))
      }
    }
  }
  return table
}

function buildChild(plan: PlanSpec, a: ActuarialAssumptions): Table {
  const table: Table = {}
  if (plan.term.type !== 'maturityAge' || !plan.child) return table
  const { minChildAge, maxChildAge } = plan.child
  const terms = new Set<number>()
  for (const maturityAge of plan.term.options)
    for (let age = minChildAge; age <= maxChildAge; age++) if (maturityAge - age >= 5) terms.add(maturityAge - age)
  for (const term of [...terms].sort((x, y) => x - y)) {
    table[String(term)] = {}
    // Official Dak Sewa children-policy rates depend on the term only; the
    // quoted child ages are used verbatim and the ages between are interpolated.
    const series = officialSeries(plan.product, 'CHILD', term)
    for (let age = minChildAge; age <= maxChildAge; age++) {
      if (age + term < plan.term.options[0] || age + term > plan.term.options[plan.term.options.length - 1]) continue
      if (series) {
        table[String(term)][String(age)] = Math.round(interpolateByTerm(series, age) * 100) / 100
      } else {
        const model = grossMonthlyRatePer1000(childSpec(age, term, plan.bonusRate, a), a)
        table[String(term)][String(age)] = roundRate(plan.product, model * endowmentTermFactor(plan.product, term, plan.bonusRate, a))
      }
    }
  }
  return table
}

function buildProduct(product: Product, a: ActuarialAssumptions): ProductTables {
  const plans = PLANS.filter((p) => p.product === product)
  const find = (kind: PlanSpec['kind']) => plans.find((p) => p.kind === kind)!
  return {
    EA: buildEA(find('EA'), a),
    WLA: buildWLA(find('WLA'), a),
    AEA: buildAEA(
      plans.filter((p) => p.kind === 'AEA'),
      a,
    ),
    CHILD: buildChild(find('CHILD'), a),
  }
}

const output = {
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    unit: 'Monthly premium (₹) per ₹1,000 sum assured, by age next birthday',
    note:
      'Official Dak Sewa app quotations (official-rates.json) at ages 19, 22, 25, 29, 35, 40, 45, 50, 55 (children policy: child ages 5, 8, 10, 12, 15, 18, 20) are used verbatim; the actuarial model interpolates the ages in between. Override individual cells in rate-overrides.ts with further official figures.',
    assumptions: { PLI: PLI_ASSUMPTIONS, RPLI: RPLI_ASSUMPTIONS },
  },
  PLI: buildProduct('PLI', PLI_ASSUMPTIONS),
  RPLI: buildProduct('RPLI', RPLI_ASSUMPTIONS),
}

const here = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(here, '../src/domain/rates/premium-tables.json')
mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(output, null, 1) + '\n')
console.log(`Wrote ${outFile}`)
