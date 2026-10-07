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

type ReadingFormProps = {
  payload: DeviceReadingPayload | null;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

// SPEC-010: form đối soát điền sẵn từ AI; người duyệt sửa rồi "Lưu vào sổ" (Enter cũng lưu).
export function ReadingForm({ payload, pending, error, onSubmit }: ReadingFormProps) {
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
            hint={payload?.measuredAt ? undefined : 'AI không đọc được ngày, vui lòng nhập theo máy.'}
            {...form.register('measuredAt')}
          />
          <ReadingField id="measuredTime" label="Giờ đo" type="time" {...form.register('measuredTime')} />
        </div>
        <ReadingKindPicker register={form.register('kind')} />
        <ReadingValueFields kind={kind} register={form.register} errors={errors} flagged={outOfRange} />
        {payload === null && (
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
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-[#f0fcfb]/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:p-0">
        <button
          type="submit"
          disabled={pending || (outOfRange.length > 0 && !confirmed)}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
        >
          {pending ? 'Đang lưu…' : 'Lưu vào sổ'}
        </button>
        <p className="hidden text-center text-xs text-[#55615f] lg:block">Nhấn Enter để lưu</p>
      </div>
    </form>
  );
}
