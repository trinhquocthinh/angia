import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';
import { adherenceFormSchema, suggestStatus, type AdherenceFormValues } from '../application/adherenceForm';
import type { MedicationPeriods } from '../application/medicationPeriods';
import type { RecordAdherenceRequest } from '../application/ports';
import { AdherenceFields } from './AdherenceFields';
import { AdherenceStatusList } from './AdherenceStatusList';

type Props = {
  today: string;
  groups: MedicationPeriods[];
  suggestions: string[];
  pending: boolean;
  error: string | null;
  onSubmit: (request: RecordAdherenceRequest) => void;
  onCancel: () => void;
};

export function AdherenceForm({ today, groups, suggestions, pending, error, onSubmit, onCancel }: Props) {
  const form = useForm<AdherenceFormValues>({
    resolver: zodResolver(adherenceFormSchema(today)),
    defaultValues: { medicationName: '', status: 'taking', fromDate: today },
    mode: 'onTouched',
  });
  const name = useWatch({ control: form.control, name: 'medicationName' });
  const statusDirty = form.formState.dirtyFields.status;
  // Gợi ý trạng thái ngược với giai đoạn mới nhất của thuốc trùng tên, trừ khi người dùng đã tự chọn.
  useEffect(() => {
    if (!statusDirty) form.setValue('status', suggestStatus(name, groups));
  }, [form, name, groups, statusDirty]);
  const submit = form.handleSubmit((values) => onSubmit(values));
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 px-6 py-5">
        <AdherenceStatusList groups={groups} />
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5 border-0 p-0">
          <AdherenceFields form={form} today={today} suggestions={suggestions} />
          {error && (
            <p role="alert" className="rounded-xl bg-[#fdecea] p-3 text-sm text-[#b42318]">
              {error}
            </p>
          )}
        </fieldset>
      </div>
      <SidePanelFooter
        submitLabel={pending ? 'Đang lưu…' : 'Lưu giai đoạn'}
        cancelLabel="Hủy bỏ"
        disabled={pending}
        submit={true}
        cancelDisabled={pending}
        onCancel={onCancel}
      />
    </form>
  );
}
