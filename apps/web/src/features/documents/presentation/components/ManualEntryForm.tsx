import { useState } from 'react';
import type { DocumentType } from '../../application/ports';
import type { ApproveDocumentRequest } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { LabResultForm } from './LabResultForm';
import { PrescriptionForm } from './PrescriptionForm';
import { ReadingForm } from './ReadingForm';
import { RecordTypePicker } from './RecordTypePicker';

type ManualEntryFormProps = {
  initialType: DocumentType | null;
  allowReading?: boolean;
  intro: string;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

// SPEC-011 + BR-016: form trống theo loại người nhập chọn; không có gì do AI điền sẵn hay suy đoán.
// Dùng cho chứng từ AI không đọc được (cạnh ảnh gốc) và nhập trực tiếp không kèm ảnh.
export function ManualEntryForm({
  initialType,
  allowReading = true,
  intro,
  pending,
  error,
  onSubmit,
}: ManualEntryFormProps) {
  const [selectedType, setType] = useState(initialType);
  const type = !allowReading && selectedType === 'device_reading' ? null : selectedType;
  const formProps = { payload: null, manual: true, pending, error, onSubmit };
  return (
    <div className="flex flex-col gap-5">
      <section className="doc-bento-card flex flex-col gap-4 rounded-3xl p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <span className="doc-clay-tile">
            <ProfileSectionIcon name="edit_note" size={28} />
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading text-heading-2 font-semibold text-accent">Nhập tay</h2>
            <p className="mt-1 text-caption leading-relaxed text-text-secondary">{intro}</p>
          </div>
        </div>
        <RecordTypePicker value={type} onChange={setType} allowReading={allowReading} />
      </section>
      {type === 'prescription' && <PrescriptionForm key={type} {...formProps} />}
      {type === 'lab_result' && <LabResultForm key={type} {...formProps} />}
      {type === 'device_reading' && <ReadingForm key={type} {...formProps} />}
    </div>
  );
}
