import type { UseFormReturn } from 'react-hook-form';
import type { LabResultFormValues } from '../../application/labResultForm';
import { ReadingField } from './ReadingField';

type GeneralFieldsProps = { form: UseFormReturn<LabResultFormValues>; aiDate: boolean };

// Thông tin chung của phiếu: ngày trả kết quả bắt buộc (SPEC-010), nơi xét nghiệm chép nguyên văn.
export function LabResultGeneralFields({ form, aiDate }: GeneralFieldsProps) {
  const errors = form.formState.errors;
  return (
    <section className="flex flex-col gap-5 rounded-[20px] bg-white p-5 lg:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#286958]">Thông tin chung</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadingField
          id="resultDate"
          label="Ngày trả kết quả *"
          type="date"
          error={errors.resultDate?.message}
          hint={aiDate ? undefined : 'AI không đọc được ngày, vui lòng nhập theo phiếu.'}
          {...form.register('resultDate')}
        />
        <ReadingField
          id="facility"
          label="Nơi xét nghiệm"
          autoComplete="off"
          compact
          {...form.register('facility')}
        />
      </div>
    </section>
  );
}
