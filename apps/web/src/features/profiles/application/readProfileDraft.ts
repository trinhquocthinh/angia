import type { ProfileRequest } from './ports';
export function readProfileDraft(
  displayName: string,
  birthYear: string,
  linkedAccountId: string,
  currentYear: number,
) {
  const errors: { displayName?: string; birthYear?: string } = {};
  const name = displayName.trim();
  if (!name || name.length > 60) errors.displayName = 'Tên thân mật cần có từ 1 đến 60 ký tự.';
  const year = Number(birthYear);
  if (birthYear && (!Number.isInteger(year) || year < 1900 || year > currentYear)) {
    errors.birthYear = `Nhập năm sinh từ 1900 đến ${currentYear}.`;
  }
  const body: ProfileRequest = {
    displayName: name,
    ...(birthYear ? { birthYear: year } : {}),
    ...(linkedAccountId ? { linkedAccountId } : {}),
  };
  return { body: Object.keys(errors).length ? null : body, errors };
}
