/**
 * India Post rates premiums on "age next birthday" (ANB). Given a date of birth
 * we compute completed age and ANB = completed age + 1.
 */
export interface AgeInfo {
  completed: number
  nextBirthday: number
}

export function ageFromDOB(dob: Date, asOf: Date = new Date()): AgeInfo | null {
  if (Number.isNaN(dob.getTime())) return null
  let completed = asOf.getFullYear() - dob.getFullYear()
  const m = asOf.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) completed--
  if (completed < 0 || completed > 120) return null
  return { completed, nextBirthday: completed + 1 }
}

export function ageFromCompleted(completed: number): AgeInfo {
  const c = Math.max(0, Math.floor(completed))
  return { completed: c, nextBirthday: c + 1 }
}

export function parseISODate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? null : d
}
