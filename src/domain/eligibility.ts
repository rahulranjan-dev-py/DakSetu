export type Occupation =
  | 'centralGovt'
  | 'stateGovt'
  | 'psu'
  | 'defence'
  | 'bank'
  | 'localBody'
  | 'education'
  | 'privateSchool'
  | 'gds'
  | 'contractGovt'
  | 'cooperative'
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
  /**
   * Operative savings account with POSB or any scheduled bank (at least one
   * customer-initiated transaction in the preceding 24 months) – an additional
   * RPLI eligibility route since 14 Aug 2026 (F. No. 92-1/2026-LI).
   */
  hasOperativeAccount: boolean
  /** Standard age proof available (without it RPLI entry is limited to age 45) */
  standardAgeProof: boolean
}

export interface EligibilityResult {
  pli: boolean
  rpli: boolean
  pliReason: 'eligible' | 'age' | 'occupation'
  rpliReason: 'eligible' | 'eligibleAccount' | 'age' | 'ageProof' | 'residence'
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
  'privateSchool',
  'gds',
  'contractGovt',
  'cooperative',
  'listedCompany',
  'professional',
  'graduate',
]

export const ENTRY_AGE = { min: 19, max: 55 }
/** RPLI entry age ceiling when only non-standard age proof is available */
export const RPLI_MAX_AGE_NON_STANDARD_PROOF = 45

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const ageOk = input.age >= ENTRY_AGE.min && input.age <= ENTRY_AGE.max
  const occupationOk = PLI_ELIGIBLE_OCCUPATIONS.includes(input.occupation)
  const ruralOk = input.residence === 'rural'
  const accountOk = input.hasOperativeAccount
  const rpliAgeOk = ageOk && (input.standardAgeProof || input.age <= RPLI_MAX_AGE_NON_STANDARD_PROOF)

  const pli = ageOk && occupationOk
  const rpli = rpliAgeOk && (ruralOk || accountOk)

  return {
    pli,
    rpli,
    pliReason: !ageOk ? 'age' : !occupationOk ? 'occupation' : 'eligible',
    rpliReason: !ageOk
      ? 'age'
      : !rpliAgeOk
        ? 'ageProof'
        : ruralOk
          ? 'eligible'
          : accountOk
            ? 'eligibleAccount'
            : 'residence',
  }
}
