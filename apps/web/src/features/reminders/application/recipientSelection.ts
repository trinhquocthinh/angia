type Validation = { ok: true; ids: string[] } | { ok: false; message: string };

export const toggleRecipient = (selected: string[], accountId: string): string[] =>
  selected.includes(accountId) ? selected.filter((id) => id !== accountId) : [...selected, accountId];

// SPEC-026: hồ sơ không liên kết cần ≥ 1 người nhận; API vẫn kiểm vai trò main (BR-039).
export const validateRecipientSelection = (selected: string[]): Validation =>
  selected.length === 0
    ? { ok: false, message: 'Chọn ít nhất một người nhận nhắc.' }
    : { ok: true, ids: selected };
