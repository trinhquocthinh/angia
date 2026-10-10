import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  readingFormSchema,
  toApproveRequest,
  toReadingFormValues,
  type ReadingFormValues,
} from '../../application/readingForm';
import type { ApproveDocumentRequest, DeviceReadingPayload } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { OutOfRangeConfirm } from './OutOfRangeConfirm';
import { ReadingField } from './ReadingField';
import { ReadingKindPicker } from './ReadingKindPicker';
import { ReadingValueFields } from './ReadingValueFields';
import { ReviewSubmitBar } from './ReviewSubmitBar';

type ReadingFormProps = {
  payload: DeviceReadingPayload | null;
  /** Nhập tay (SPEC-011): form trống, không nhắc tới dữ liệu AI. */
  manual?: boolean;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

// SPEC-010: form đối soát điền sẵn từ AI; người duyệt sửa rồi "Lưu vào sổ" (Enter cũng lưu).
export function ReadingForm({ payload, manual = false, pending, error, onSubmit }: ReadingFormProps) {
  const form = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: toReadingFormValues(payload),
    mode: 'onTouched',
  });
  const kind = useWatch({ control: form.control, name: 'kind' });
  const [confirmed, setConfirmed] = useState(false);
  const errors = form.formState.errors;
  const outOfRange = error?.code === 'ERR_OUT_OF_RANGE_UNCONFIRMED' ? error.fields : [];
  const otherError = error && outOfRange.length === 0 ? error.message : null;
  const submit = form.handleSubmit((values) => onSubmit(toApproveRequest(values, confirmed)));
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-[20px] bg-white p-5 lg:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#286958]">
          Thông tin trên máy đo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadingField
            id="measuredAt"
            label="Ngày đo *"
            type="date"
            error={errors.measuredAt?.message}
            hint={
              manual || payload?.measuredAt ? undefined : 'AI không đọc được ngày, vui lòng nhập theo máy.'
            }
            {...form.register('measuredAt')}
          />
          <ReadingField id="measuredTime" label="Giờ đo" type="time" {...form.register('measuredTime')} />
        </div>
        <ReadingKindPicker register={form.register('kind')} />
        <ReadingValueFields kind={kind} register={form.register} errors={errors} flagged={outOfRange} />
        {payload === null && !manual && (
          <p className="text-sm text-[#55615f]">Chưa có dữ liệu AI trích xuất, vui lòng nhập theo ảnh.</p>
        )}
      </section>
      {outOfRange.length > 0 && (
        <OutOfRangeConfirm fields={outOfRange} confirmed={confirmed} onConfirm={setConfirmed} />
      )}
      {otherError && (
        <p role="alert" className="rounded-2xl bg-[#fdecea] p-4 text-sm text-[#b42318]">
          {otherError}
        </p>
      )}
      <ReviewSubmitBar pending={pending} disabled={outOfRange.length > 0 && !confirmed} />
    </form>
  );
}
