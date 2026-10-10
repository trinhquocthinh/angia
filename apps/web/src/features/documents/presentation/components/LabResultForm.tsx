import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  emptyLabResultItem,
  LAB_RESULT_ROW_FIELDS,
  labResultFormSchema,
  toLabResultApproval,
  toLabResultFormValues,
  type LabResultFormValues,
} from '../../application/labResultForm';
import type { ApproveDocumentRequest, LabResultPayload } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { summarizeRowErrors } from '../../application/rowErrors';
import { AddRowButton } from './AddRowButton';
import { LabResultGeneralFields } from './LabResultGeneralFields';
import { LabResultItemCard } from './LabResultItemCard';
import { ReviewSubmitBar } from './ReviewSubmitBar';
import { RowErrorSummary } from './RowErrorSummary';

type LabResultFormProps = {
  payload: LabResultPayload | null;
  /** Nhập tay (SPEC-011): form trống, không nhắc tới dữ liệu AI. */
  manual?: boolean;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

// SPEC-010 + BR-022: form phiếu xét nghiệm nhiều chỉ số điền sẵn từ AI, chép nguyên văn rồi "Lưu vào sổ".
export function LabResultForm({ payload, manual = false, pending, error, onSubmit }: LabResultFormProps) {
  const form = useForm<LabResultFormValues>({
    resolver: zodResolver(labResultFormSchema),
    defaultValues: toLabResultFormValues(payload),
    mode: 'onTouched',
  });
  const items = useFieldArray({ control: form.control, name: 'items' });
  const names = useWatch({ control: form.control, name: 'items' }).map((item) => item.testName);
  const rows = summarizeRowErrors(form.formState.errors.items, names, LAB_RESULT_ROW_FIELDS);
  const submit = form.handleSubmit((values) =>
    onSubmit({ type: 'lab_result', data: toLabResultApproval(values) }),
  );
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <LabResultGeneralFields form={form} aiDate={manual || Boolean(payload?.resultDate)} />
      <section
        aria-labelledby="lab-items-title"
        className="flex flex-col gap-4 rounded-[20px] bg-white p-5 lg:p-6"
      >
        <h2 id="lab-items-title" className="text-xs font-semibold uppercase tracking-wider text-[#286958]">
          Danh sách chỉ số ({items.fields.length} chỉ số)
        </h2>
        {payload === null && !manual && (
          <p className="text-sm text-[#55615f]">Chưa có dữ liệu AI trích xuất, vui lòng nhập theo ảnh.</p>
        )}
        <ol className="flex flex-col gap-4">
          {items.fields.map((field, index) => (
            <LabResultItemCard
              key={field.id}
              form={form}
              index={index}
              onRemove={items.fields.length > 1 ? () => items.remove(index) : null}
            />
          ))}
        </ol>
        <AddRowButton label="Thêm chỉ số" onAdd={() => items.append(emptyLabResultItem())} />
      </section>
      <RowErrorSummary rows={rows} noun="chỉ số" anchorPrefix="lab-item" />
      {error && (
        <p role="alert" className="rounded-2xl bg-[#fdecea] p-4 text-sm text-[#b42318]">
          {error.message}
        </p>
      )}
      <ReviewSubmitBar pending={pending} disabled={false} />
    </form>
  );
}
