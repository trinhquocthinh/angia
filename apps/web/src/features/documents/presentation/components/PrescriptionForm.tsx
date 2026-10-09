import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  emptyPrescriptionItem,
  PRESCRIPTION_ROW_FIELDS,
  prescriptionFormSchema,
  toPrescriptionApproval,
  toPrescriptionFormValues,
  type PrescriptionFormValues,
} from '../../application/prescriptionForm';
import { summarizeRowErrors } from '../../application/rowErrors';
import type { ApproveDocumentRequest, PrescriptionPayload } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { AddRowButton } from './AddRowButton';
import { PrescriptionGeneralFields } from './PrescriptionGeneralFields';
import { PrescriptionItemCard } from './PrescriptionItemCard';
import { ReviewSubmitBar } from './ReviewSubmitBar';
import { RowErrorSummary } from './RowErrorSummary';

type PrescriptionFormProps = {
  payload: PrescriptionPayload | null;
  /** Nhập tay (SPEC-011): form trống, không nhắc tới dữ liệu AI. */
  manual?: boolean;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

const SERVER_ROW_MESSAGE = 'Dòng này còn thiếu liều, buổi dùng hoặc số ngày — đối chiếu lại với đơn.';

// SPEC-010 + BR-025: form đơn thuốc nhiều dòng điền sẵn từ AI, lưu qua API duyệt (E3-S3-T3).
// API chặn dòng thiếu liều bằng ERR_DOSE_INFO_MISSING kèm chỉ số dòng → gắn lỗi vào đúng dòng.
export function PrescriptionForm({
  payload,
  manual = false,
  pending,
  error,
  onSubmit,
}: PrescriptionFormProps) {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: toPrescriptionFormValues(payload),
    mode: 'onTouched',
  });
  const items = useFieldArray({ control: form.control, name: 'items' });
  const names = useWatch({ control: form.control, name: 'items' }).map((item) => item.name);
  useEffect(() => {
    for (const index of error?.invalidItemIndexes ?? [])
      form.setError(`items.${index}.durationDays`, { type: 'server', message: SERVER_ROW_MESSAGE });
  }, [error, form]);
  const rows = summarizeRowErrors(form.formState.errors.items, names, PRESCRIPTION_ROW_FIELDS);
  const otherError = error && error.code !== 'ERR_DOSE_INFO_MISSING' ? error.message : null;
  const submit = form.handleSubmit((values) =>
    onSubmit({ type: 'prescription', data: toPrescriptionApproval(values) }),
  );
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <PrescriptionGeneralFields form={form} aiDate={manual || Boolean(payload?.issuedDate)} />
      <section
        aria-labelledby="rx-items-title"
        className="flex flex-col gap-4 rounded-[20px] bg-white p-5 lg:p-6"
      >
        <h2 id="rx-items-title" className="text-xs font-semibold uppercase tracking-wider text-[#286958]">
          Danh sách thuốc ({items.fields.length} loại)
        </h2>
        {payload === null && !manual && (
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
        <AddRowButton label="Thêm thuốc" onAdd={() => items.append(emptyPrescriptionItem())} />
      </section>
      <RowErrorSummary rows={rows} noun="dòng thuốc" anchorPrefix="rx-item" />
      {otherError && (
        <p role="alert" className="rounded-2xl bg-[#fdecea] p-4 text-sm text-[#b42318]">
          {otherError}
        </p>
      )}
      <ReviewSubmitBar pending={pending} disabled={false} />
    </form>
  );
}
