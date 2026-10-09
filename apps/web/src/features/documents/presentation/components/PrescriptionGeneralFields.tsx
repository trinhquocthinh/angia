import type { UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ReadingField } from './ReadingField';

type GeneralFieldsProps = { form: UseFormReturn<PrescriptionFormValues>; aiDate: boolean };

// Thông tin chung của đơn: ngày kê bắt buộc (BR-015), nơi khám và chẩn đoán chép nguyên văn từ đơn.
export function PrescriptionGeneralFields({ form, aiDate }: GeneralFieldsProps) {
  const errors = form.formState.errors;
  return (
    <section className="flex flex-col gap-5 rounded-[20px] bg-white p-5 lg:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#286958]">Thông tin chung</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadingField
          id="issuedDate"
          label="Ngày kê đơn *"
          type="date"
          error={errors.issuedDate?.message}
          hint={aiDate ? undefined : 'AI không đọc được ngày, vui lòng nhập theo đơn.'}
          {...form.register('issuedDate')}
        />
        <ReadingField
          id="facility"
          label="Nơi khám"
          autoComplete="off"
          compact
          {...form.register('facility')}
        />
      </div>
      <ReadingField
        id="diagnosis"
        label="Chẩn đoán ghi trên đơn"
        autoComplete="off"
        compact
        hint="Để biết đơn thuốc này điều trị bệnh gì; đơn không ghi thì để trống."
        {...form.register('diagnosis')}
      />
    </section>
  );
}
