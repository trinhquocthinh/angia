type FieldError = { message?: string | undefined } | undefined;

export type RowErrorSummary = { index: number; label: string; messages: string[] };

// Form nhiều dòng (đơn thuốc BR-025, xét nghiệm SPEC-010) bị chặn khi dòng thiếu thông tin —
// tóm tắt chỉ rõ dòng nào để người duyệt nhảy tới. `errors` là lỗi mảng của RHF (có thể thưa,
// kèm lỗi gốc); duyệt theo số dòng trong `names`, lời nhắn theo thứ tự `fields`.
export function summarizeRowErrors<Field extends string>(
  errors: { readonly [index: number]: Partial<Record<Field, FieldError>> | undefined } | undefined,
  names: readonly string[],
  fields: readonly Field[],
): RowErrorSummary[] {
  return names.flatMap((rawName, index) => {
    const messages = fields.flatMap((field) => errors?.[index]?.[field]?.message ?? []);
    if (messages.length === 0) return [];
    const name = rawName.trim();
    return [{ index, label: name ? `Dòng ${index + 1} · ${name}` : `Dòng ${index + 1}`, messages }];
  });
}
