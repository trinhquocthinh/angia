import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  emptyPrescriptionItem,
  prescriptionFormSchema,
  toPrescriptionApproval,
  toPrescriptionFormValues,
  type PrescriptionFormValues,
} from '../../application/prescriptionForm';
import { summarizeRowErrors } from '../../application/prescriptionRowErrors';
import type { PrescriptionPayload } from '../../application/reviewPorts';
import { PrescriptionErrorSummary } from './PrescriptionErrorSummary';
import { PrescriptionGeneralFields } from './PrescriptionGeneralFields';
import { PrescriptionItemCard } from './PrescriptionItemCard';
import { ReviewSubmitBar } from './ReviewSubmitBar';

// SPEC-010 + BR-025: form đơn thuốc nhiều dòng điền sẵn từ AI. API lưu đơn thuốc làm ở E3-S3-T3 —
// tới lúc đó form chỉ kiểm tra đủ thông tin rồi báo chưa lưu được.
export function PrescriptionForm({ payload }: { payload: PrescriptionPayload | null }) {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: toPrescriptionFormValues(payload),
    mode: 'onTouched',
  });
  const items = useFieldArray({ control: form.control, name: 'items' });
  const names = useWatch({ control: form.control, name: 'items' }).map((item) => item.name);
  // E3-S3-T3 thay bằng gọi API duyệt với bản đối soát này.
  const [approval, setApproval] = useState<PrescriptionPayload | null>(null);
  const rows = summarizeRowErrors(form.formState.errors.items, names);
  const submit = form.handleSubmit(
    (values) => setApproval(toPrescriptionApproval(values)),
    () => setApproval(null),
  );
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <PrescriptionGeneralFields form={form} aiDate={Boolean(payload?.issuedDate)} />
      <section
        aria-labelledby="rx-items-title"
        className="flex flex-col gap-4 rounded-[20px] bg-white p-5 lg:p-6"
      >
        <h2 id="rx-items-title" className="text-xs font-semibold uppercase tracking-wider text-[#286958]">
          Danh sách thuốc ({items.fields.length} loại)
        </h2>
        {payload === null && (
          <p className="text-sm text-[#55615f]">Chưa có dữ liệu AI trích xuất, vui lòng nhập theo ảnh.</p>
        )}
        <ol className="flex flex-col gap-4">
          {items.fields.map((field, index) => (
            <PrescriptionItemCard
              key={field.id}
              form={form}
              index={index}
              onRemove={items.fields.length > 1 ? () => items.remove(index) : null}
            />
          ))}
        </ol>
        <button
          type="button"
          onClick={() => items.append(emptyPrescriptionItem())}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dashed border-[#6f7975] px-4 text-sm font-semibold text-[#004135] hover:bg-[#eaf6f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          + Thêm thuốc
        </button>
      </section>
      <PrescriptionErrorSummary rows={rows} />
      {approval && (
        <p role="status" className="rounded-2xl bg-[#e4f0f0] p-4 text-sm text-[#20594b]">
          Đơn thuốc đã đủ thông tin ({approval.items.length} loại thuốc). Lưu đơn thuốc vào sổ sẽ có ở bản cập
          nhật sau.
        </p>
      )}
      <ReviewSubmitBar pending={false} disabled={false} />
    </form>
  );
}
