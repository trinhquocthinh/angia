const FIELD_ORDER = ['name', 'quantityPerDose', 'slots', 'durationDays'] as const;

type FieldError = { message?: string | undefined } | undefined;
type RowErrors = Partial<Record<(typeof FIELD_ORDER)[number], FieldError>> | undefined;

export type RowErrorSummary = { index: number; label: string; messages: string[] };

// BR-025: đơn bị chặn khi thiếu liều/buổi — tóm tắt chỉ rõ dòng nào để người duyệt nhảy tới.
// `errors` là lỗi mảng của RHF (có thể thưa, kèm lỗi gốc); duyệt theo số dòng trong `names`.
export function summarizeRowErrors(
  errors: { readonly [index: number]: RowErrors } | undefined,
  names: readonly string[],
): RowErrorSummary[] {
  return names.flatMap((rawName, index) => {
    const messages = FIELD_ORDER.flatMap((field) => errors?.[index]?.[field]?.message ?? []);
    if (messages.length === 0) return [];
    const name = rawName.trim();
    return [{ index, label: name ? `Dòng ${index + 1} · ${name}` : `Dòng ${index + 1}`, messages }];
  });
}
