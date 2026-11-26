export function storeLargeText(value: boolean): void {
  try {
    localStorage.setItem('angia-large-text', String(value));
  } catch {
    // Không lưu được: lựa chọn vẫn có hiệu lực trong phiên hiện tại.
  }
}
