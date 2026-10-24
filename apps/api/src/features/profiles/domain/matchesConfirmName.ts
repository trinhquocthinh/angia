// SPEC-007: khớp từng ký tự sau chuẩn hóa NFC — bàn phím có thể gõ dấu dạng tổ hợp; vẫn phân biệt hoa/thường.
export function matchesConfirmName(displayName: string, confirmName: string): boolean {
  return displayName.normalize('NFC') === confirmName.normalize('NFC');
}
