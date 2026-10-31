import type { UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import type { PrescriptionPayload } from '../../application/reviewPorts';
import { AutoReadLabel } from './AutoReadLabel';
import { ReadingField } from './ReadingField';
import { ReviewSectionTitle } from './ReviewSectionTitle';

type GeneralFieldsProps = {
  form: UseFormReturn<PrescriptionFormValues>;
  payload: PrescriptionPayload | null;
  manual: boolean;
};

// Thông tin chung của đơn: ngày kê bắt buộc (BR-015), nơi khám và chẩn đoán chép nguyên văn từ đơn.
export function PrescriptionGeneralFields({ form, payload, manual }: GeneralFieldsProps) {
  const aiDate = manual || Boolean(payload?.issuedDate);
  const autoRead = Boolean(payload) && !manual;
  const errors = form.formState.errors;
  return (
    <section className="flex flex-col gap-5 rounded-[20px] bg-white p-4 shadow-card lg:p-6">
      <ReviewSectionTitle title="Thông tin chung" aside={autoRead && <AutoReadLabel />} />
      <div className="grid items-start gap-3 min-[375px]:grid-cols-2 sm:gap-4">
        <ReadingField
          id="issuedDate"
          label="Ngày kê đơn *"
          type="date"
          compact
          error={errors.issuedDate?.message}
          hint={aiDate ? undefined : 'Chưa tự động nhận diện được ngày, vui lòng nhập theo đơn.'}
          {...form.register('issuedDate')}
        />
        <ReadingField
          id="revisitDate"
          label="Ngày hẹn tái khám"
          type="date"
          compact
          error={errors.revisitDate?.message}
          hint="Chép đúng ngày hẹn trên đơn; đơn không ghi thì để trống."
          {...form.register('revisitDate')}
        />
      </div>
      <ReadingField
        id="facility"
        label="Nơi khám"
        autoComplete="off"
        compact
        icon="hospital"
        {...form.register('facility')}
      />
      <ReadingField
        id="diagnosis"
        label="Chẩn đoán ghi trên đơn"
        autoComplete="off"
        compact
        icon="stethoscope"
        hint="Để biết đơn thuốc này điều trị bệnh gì; đơn không ghi thì để trống."
        {...form.register('diagnosis')}
      />
    </section>
  );
}
