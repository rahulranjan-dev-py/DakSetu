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
import { ANCHOR_AGE, OFFICIAL_ANCHORS, interpolateByTerm, roundRate, type AnchorKind } from '../src/domain/rates/official-anchors.ts'

/**
 * Scale factor that makes the model reproduce the official Dak Sewa rate at the
 * anchor age for a given term; interpolated across terms, applied at every age.
 */
function anchorFactor(product: Product, kind: AnchorKind, term: number, modelAtAnchor: (t: number) => number): number {
  const anchors = OFFICIAL_ANCHORS[product][kind]
  const ratios: Record<number, number> = {}
  for (const t of Object.keys(anchors).map(Number)) ratios[t] = anchors[t] / modelAtAnchor(t)
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
      const model = grossMonthlyRatePer1000(endowmentSpec(age, term, plan.bonusRate), a)
      const factor = anchorFactor(plan.product, 'EA', term, (t) =>
        grossMonthlyRatePer1000(endowmentSpec(ANCHOR_AGE, t, plan.bonusRate), a),
      )
      table[String(maturityAge)][String(age)] = roundRate(plan.product, model * factor)
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
      const model = grossMonthlyRatePer1000(wholeLifeSpec(age, ceasingAge, plan.bonusRate), a)
      const factor = anchorFactor(plan.product, 'WLA', ppt, (t) =>
        grossMonthlyRatePer1000(wholeLifeSpec(ANCHOR_AGE, ANCHOR_AGE + t, plan.bonusRate), a),
      )
      table[String(ceasingAge)][String(age)] = roundRate(plan.product, model * factor)
    }
  }
  return table
}

function buildAEA(plans: PlanSpec[], a: ActuarialAssumptions): Table {
  const table: Table = {}
  // Survival schedule for any anchor term, across all money-back plans of the product
  const scheduleFor = (t: number) => plans.find((p) => p.moneyBack?.[t])?.moneyBack![t] ?? []
  for (const plan of plans) {
    if (plan.term.type !== 'fixedTerm' || !plan.moneyBack) continue
    for (const term of plan.term.options) {
      const schedule = plan.moneyBack[term]
      const maxAge = plan.maxAgeByTerm?.[term] ?? plan.maxAge
      table[String(term)] = {}
      for (let age = plan.minAge; age <= maxAge; age++) {
        const model = grossMonthlyRatePer1000(anticipatedSpec(age, term, schedule, plan.bonusRate), a)
        const factor = anchorFactor(plan.product, 'AEA', term, (t) =>
          grossMonthlyRatePer1000(anticipatedSpec(ANCHOR_AGE, t, scheduleFor(t), plan.bonusRate), a),
        )
        table[String(term)][String(age)] = roundRate(plan.product, model * factor)
      }
    }
  }
  return table
}

function buildChild(plan: PlanSpec, a: ActuarialAssumptions): Table {
  const table: Table = {}
  if (plan.term.type !== 'termRange' || !plan.child) return table
  for (let term = plan.term.min; term <= plan.term.max; term++) {
    table[String(term)] = {}
    for (let age = plan.child.minChildAge; age <= plan.child.maxChildAge; age++) {
      // No official child rates in hand: scale by the endowment anchor for the same term
      const model = grossMonthlyRatePer1000(childSpec(age, term, plan.bonusRate, a), a)
      const factor = anchorFactor(plan.product, 'EA', term, (t) =>
        grossMonthlyRatePer1000(endowmentSpec(ANCHOR_AGE, t, plan.bonusRate), a),
      )
      table[String(term)][String(age)] = roundRate(plan.product, model * factor)
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
      'Anchored to official Dak Sewa app quotations at age 29 (official-anchors.ts); the actuarial model supplies the variation across ages. Override individual cells in rate-overrides.ts with further official figures.',
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
