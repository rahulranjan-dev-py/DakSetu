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
      table[String(maturityAge)][String(age)] = grossMonthlyRatePer1000(
        endowmentSpec(age, term, plan.bonusRate),
        a,
      )
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
      table[String(ceasingAge)][String(age)] = grossMonthlyRatePer1000(
        wholeLifeSpec(age, ceasingAge, plan.bonusRate),
        a,
      )
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
        table[String(term)][String(age)] = grossMonthlyRatePer1000(
          anticipatedSpec(age, term, schedule, plan.bonusRate),
          a,
        )
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
      table[String(term)][String(age)] = grossMonthlyRatePer1000(
        childSpec(age, term, plan.bonusRate, a),
        a,
      )
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
      'Calibrated actuarial baseline of the India Post PLI/RPLI rate charts. Override individual cells in rate-overrides.ts with official figures.',
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
