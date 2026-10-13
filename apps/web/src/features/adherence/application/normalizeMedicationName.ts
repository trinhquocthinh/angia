// Cùng quy tắc normalizeName của API (SPEC-012): chữ thường, bỏ dấu (kể cả đ), gộp khoảng trắng.
export function normalizeMedicationName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
