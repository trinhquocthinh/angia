import type { ProfileRequest } from './ports';
import { readBirthYear } from './readBirthYear';
export function readProfileDraft(
  displayName: string,
  birthYear: string,
  linkedAccountId: string,
  currentYear: number,
) {
  const errors: { displayName?: string; birthYear?: string } = {};
  const name = displayName.trim();
  if (!name || name.length > 60) errors.displayName = 'Tên thân mật cần có từ 1 đến 60 ký tự.';
  const year = readBirthYear(birthYear, currentYear);
  if (year === null) errors.birthYear = 'Nhập năm sinh từ 1900 đến năm nay.';
  if (year === null || Object.keys(errors).length) return { body: null, errors };
  const body: ProfileRequest = {
    displayName: name,
    birthYear: year,
    ...(linkedAccountId ? { linkedAccountId } : {}),
  };
  return { body, errors };
}
