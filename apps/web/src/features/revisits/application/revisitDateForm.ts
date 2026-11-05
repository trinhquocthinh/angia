import { z } from 'zod';

const dateField = z.union([z.literal(''), z.iso.date('Nhập ngày hẹn hợp lệ.')]);

// Ngày hẹn chép từ đơn; vẫn chấp nhận ngày quá khứ khi lưu trữ đơn cũ (SPEC-043).
export const revisitDateFormSchema = z
  .object({
    issuedDate: z.string().min(1, 'Nhập ngày kê ghi trên đơn.'),
    revisitDate: dateField,
  })
  .superRefine(({ issuedDate, revisitDate }, ctx) => {
    if (
      !revisitDate ||
      !z.iso.date().safeParse(issuedDate).success ||
      !z.iso.date().safeParse(revisitDate).success
    )
      return;
    const days =
      (Date.parse(`${revisitDate}T00:00:00Z`) - Date.parse(`${issuedDate}T00:00:00Z`)) / 86_400_000;
    if (days < 0 || days > 3650)
      ctx.addIssue({
        code: 'custom',
        path: ['revisitDate'],
        message: 'Ngày hẹn phải từ ngày kê đơn đến tối đa 3650 ngày sau đó.',
      });
  });
