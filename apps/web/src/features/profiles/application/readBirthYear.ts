export function readBirthYear(input: string, currentYear: number): number | null {
  const year = Number(input);
  return input.trim() && Number.isInteger(year) && year >= 1900 && year <= currentYear ? year : null;
}
