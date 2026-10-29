import type { UpdateProfileRequest } from './ports';
import { readBirthYear } from './readBirthYear';
export function readEditProfileDraft(birthYear: string, vitalsEnabled: boolean, currentYear: number) {
  const year = readBirthYear(birthYear, currentYear);
  if (year === null) return { body: null, error: 'Nhập năm sinh từ 1900 đến năm nay.' };
  const body: UpdateProfileRequest = { birthYear: year, vitalsEnabled };
  return { body, error: null };
}
