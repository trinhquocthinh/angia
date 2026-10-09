import { useState } from 'react';
import type { DocumentType } from '../../application/ports';
import type { ApproveDocumentRequest } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { LabResultForm } from './LabResultForm';
import { PrescriptionForm } from './PrescriptionForm';
import { ReadingForm } from './ReadingForm';
import { RecordTypePicker } from './RecordTypePicker';

type ManualEntryFormProps = {
  initialType: DocumentType | null;
  intro: string;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

// SPEC-011 + BR-016: form trống theo loại người nhập chọn; không có gì do AI điền sẵn hay suy đoán.
// Dùng cho chứng từ AI không đọc được (cạnh ảnh gốc) và nhập trực tiếp không kèm ảnh.
export function ManualEntryForm({ initialType, intro, pending, error, onSubmit }: ManualEntryFormProps) {
  const [type, setType] = useState(initialType);
  const formProps = { payload: null, manual: true, pending, error, onSubmit };
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-[20px] bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-[#004135]">Nhập tay</h2>
        <p className="text-sm leading-6 text-[#55615f]">{intro}</p>
        <RecordTypePicker value={type} onChange={setType} />
      </section>
      {type === 'prescription' && <PrescriptionForm key={type} {...formProps} />}
      {type === 'lab_result' && <LabResultForm key={type} {...formProps} />}
      {type === 'device_reading' && <ReadingForm key={type} {...formProps} />}
    </div>
  );
}
