export type Occupation =
  | 'centralGovt'
  | 'stateGovt'
  | 'psu'
  | 'defence'
  | 'bank'
  | 'localBody'
  | 'education'
  | 'listedCompany'
  | 'professional'
  | 'graduate'
  | 'selfEmployed'
  | 'farmer'
  | 'homemaker'
  | 'other'

export type Residence = 'rural' | 'urban'

export interface EligibilityInput {
  age: number
  occupation: Occupation
  residence: Residence
}

export interface EligibilityResult {
  pli: boolean
  rpli: boolean
  pliReason: 'eligible' | 'age' | 'occupation'
  rpliReason: 'eligible' | 'age' | 'residence'
}

/** Occupations / categories eligible for Postal Life Insurance. */
export const PLI_ELIGIBLE_OCCUPATIONS: Occupation[] = [
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
]

export const ENTRY_AGE = { min: 19, max: 55 }

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const ageOk = input.age >= ENTRY_AGE.min && input.age <= ENTRY_AGE.max
  const occupationOk = PLI_ELIGIBLE_OCCUPATIONS.includes(input.occupation)
  const ruralOk = input.residence === 'rural'

  const pli = ageOk && occupationOk
  const rpli = ageOk && ruralOk

  return {
    pli,
    rpli,
    pliReason: !ageOk ? 'age' : !occupationOk ? 'occupation' : 'eligible',
    rpliReason: !ageOk ? 'age' : !ruralOk ? 'residence' : 'eligible',
  }
}
