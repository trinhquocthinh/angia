import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CreateSelfReportedCourseRequest } from '@angia/contracts';
import {
  selfReportedCourseFormSchema,
  toSelfReportedCourseRequest,
  type SelfReportedCourseFormValues,
} from '../application/selfReportedCourseForm';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';
import { SelfReportedCourseFields } from './SelfReportedCourseFields';
import { SelfReportedDoseSlots } from './SelfReportedDoseSlots';
type Props = {
  disabled: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (request: CreateSelfReportedCourseRequest) => void;
  onCancel: () => void;
  /** Khung đối soát xung đột: nằm ngoài fieldset để vẫn bấm được khi form bị khóa. */
  children?: ReactNode;
};
export function SelfReportedCourseForm({ disabled, pending, error, onSubmit, onCancel, children }: Props) {
  const form = useForm<SelfReportedCourseFormValues>({
    resolver: zodResolver(selfReportedCourseFormSchema),
    defaultValues: { name: '', strength: '', quantityPerDose: '', doseUnit: '', slots: [], startDate: '' },
    mode: 'onTouched',
  });
  const submit = form.handleSubmit((values) => onSubmit(toSelfReportedCourseRequest(values)));
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 px-6 py-5">
        <p id="supplement-description" className="text-sm leading-6 text-[#55615f]">
          Thuốc này được ghi nhận dài hạn, đến khi bạn đánh dấu dừng uống.
        </p>
        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-5 border-0 p-0">
          <SelfReportedCourseFields form={form} />
          <SelfReportedDoseSlots control={form.control} error={form.formState.errors.slots?.message} />
          {error && (
            <p role="alert" className="rounded-xl bg-[#fdecea] p-3 text-sm text-[#b42318]">
              {error}
            </p>
          )}
        </fieldset>
        {children}
      </div>
      <SidePanelFooter
        submitLabel={pending ? 'Đang lưu…' : 'Lưu thuốc bổ'}
        cancelLabel="Hủy bỏ"
        disabled={disabled}
        submit={true}
        cancelDisabled={pending}
        onCancel={onCancel}
      />
    </form>
  );
}
