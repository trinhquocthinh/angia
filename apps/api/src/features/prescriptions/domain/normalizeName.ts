// SPEC-012: chữ thường, bỏ dấu tiếng Việt (kể cả đ), gộp khoảng trắng — dùng cho so khớp tên thuốc/chỉ số.
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
