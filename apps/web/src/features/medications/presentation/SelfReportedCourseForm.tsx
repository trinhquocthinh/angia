import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CreateSelfReportedCourseRequest } from '@angia/contracts';
import {
  selfReportedCourseFormSchema,
  toSelfReportedCourseRequest,
  type SelfReportedCourseFormValues,
} from '../application/selfReportedCourseForm';
import { SelfReportedCourseFields } from './SelfReportedCourseFields';
import { SelfReportedDoseSlots } from './SelfReportedDoseSlots';
type Props = {
  disabled: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (request: CreateSelfReportedCourseRequest) => void;
};
export function SelfReportedCourseForm({ disabled, pending, error, onSubmit }: Props) {
  const form = useForm<SelfReportedCourseFormValues>({
    resolver: zodResolver(selfReportedCourseFormSchema),
    defaultValues: { name: '', strength: '', quantityPerDose: '', doseUnit: '', slots: [], startDate: '' },
    mode: 'onTouched',
  });
  const submit = form.handleSubmit((values) => onSubmit(toSelfReportedCourseRequest(values)));
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <p id="supplement-description" className="text-sm leading-6 text-[#55615f]">
        Khai báo thuốc bổ, vitamin hoặc thực phẩm chức năng không qua đơn thuốc. Đợt này được ghi nhận dài
        hạn.
      </p>
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4 border-0 p-0">
        <SelfReportedCourseFields form={form} />
        <SelfReportedDoseSlots control={form.control} error={form.formState.errors.slots?.message} />
        {error && (
          <p role="alert" className="rounded-xl bg-[#fdecea] p-3 text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[#004135] px-4 font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang lưu…' : 'Lưu thuốc bổ'}
        </button>
      </fieldset>
    </form>
  );
}
