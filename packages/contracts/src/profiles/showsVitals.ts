export const CHILD_AGE_LIMIT = 16;

export function showsVitals(
  profile: { birthYear: number | null; vitalsEnabled: boolean | null },
  currentYear: number,
): boolean {
  if (profile.birthYear === null) return true;
  if (currentYear - profile.birthYear >= CHILD_AGE_LIMIT) return true;

  return profile.vitalsEnabled === true;
}
