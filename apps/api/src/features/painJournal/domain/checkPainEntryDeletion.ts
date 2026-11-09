type DeletionResult = { ok: true } | { ok: false; code: 'ERR_VALIDATION'; details: { reason: 'last_entry' } };

// Application đếm lần ghi trong cùng transaction đã khóa hàng vấn đề.
export function checkPainEntryDeletion(entryCount: number): DeletionResult {
  return entryCount <= 1
    ? { ok: false, code: 'ERR_VALIDATION', details: { reason: 'last_entry' } }
    : { ok: true };
}
