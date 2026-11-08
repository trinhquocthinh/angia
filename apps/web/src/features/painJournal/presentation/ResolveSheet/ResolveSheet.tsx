import { useId, useState } from 'react';
import { painIssueResolveDates } from '../../application/painIssueResolveDates';
import { resolvePainIssueForm } from '../../application/resolvePainIssueForm';
import { usePainIssueLifecycle } from '../../application/usePainIssueLifecycle';
import { PainIssueLifecycleDialog } from '../PainIssueDetail/PainIssueLifecycleDialog';
import type { PainIssueLifecycleProps } from '../PainIssueDetail/painIssueLifecycleTypes';
export function ResolveSheet(props: PainIssueLifecycleProps) {
  const id = useId();
  const dates = painIssueResolveDates(props.issue.lastEntry.recordedAt);
  const [date, setDate] = useState(dates.max);
  const [validation, setValidation] = useState<string | null>(null);
  const state = usePainIssueLifecycle(props.api, props.session, props.profile, props.scope, props.issue.id);
  const confirm = async () => {
    let body;
    try {
      body = resolvePainIssueForm(date, props.issue.lastEntry.recordedAt);
    } catch {
      setValidation('Ngày khỏi phải hợp lệ, từ ngày lần ghi muộn nhất đến hôm nay theo giờ Việt Nam.');
      return;
    }
    setValidation(null);
    if (await state.run({ kind: 'resolve', ...body })) props.onSaved('Đã đánh dấu vấn đề đã khỏi.');
  };
  return (
    <PainIssueLifecycleDialog
      title="Đánh dấu đã khỏi"
      confirmLabel="Đánh dấu đã khỏi"
      cancelLabel="Giữ nguyên"
      pending={state.pending}
      disabled={!state.enabled}
      error={validation ?? state.error}
      onClose={props.onClose}
      onConfirm={confirm}
    >
      <label htmlFor={id} className="block">
        Khỏi từ ngày *
      </label>
      <input
        id={id}
        type="date"
        required
        min={dates.min}
        max={dates.max}
        value={date}
        disabled={state.pending || !state.enabled}
        className="min-h-[52px] w-full rounded-lg border border-border px-3"
        onChange={(event) => {
          setDate(event.target.value);
          setValidation(null);
        }}
      />
      <p className="text-sm text-text-secondary">Ngày theo giờ Việt Nam.</p>
      <p>Bạn vẫn xem, sửa được các lần ghi và bài tập sau khi đánh dấu.</p>
    </PainIssueLifecycleDialog>
  );
}
