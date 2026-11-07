import { useState } from 'react';
import { newPainIssueFormSchema } from '../../application/newPainIssueForm';
import { useQuickPainEntry } from '../../application/useQuickPainEntry';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import type { FirstEntryValues } from '../NewPainIssueSheet/newPainIssueTypes';
import type { QuickPainEntryProps } from './quickPainEntryTypes';

export function useQuickPainEntrySheet(props: QuickPainEntryProps) {
  const { draft } = props;
  const [values, setValues] = useState<FirstEntryValues>(() => ({
    title: '',
    level: draft?.level ?? null,
    note: draft?.note ?? '',
    recordedAt: draft?.recordedAt
      ? new Date(Date.parse(draft.recordedAt) + 7 * 3_600_000).toISOString().slice(0, 16)
      : '',
  }));
  const [validation, setValidation] = useState<string | null>(null);
  const writer = useQuickPainEntry(props.api, props.session, props.profile, props.scope, props.issue.id);
  const change = (patch: Partial<FirstEntryValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setValidation(null);
  };
  const submit = async (reopen = false) => {
    const parsed = newPainIssueFormSchema().safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? 'Vui lòng chọn mức đau.');
      return;
    }
    const entry = await writer.save(parsed.data.firstEntry, reopen);
    if (entry) props.onSaved(`Đã ghi ${entry.level}/10 cho ${describeBodyLocation(props.issue)}.`);
  };
  const continueExisting = () => {
    const parsed = newPainIssueFormSchema().safeParse(values);
    if (writer.existingIssueId && parsed.success)
      props.onContinueIssue({
        kind: 'existing',
        issueId: writer.existingIssueId,
        draft: parsed.data.firstEntry,
        message: 'Vùng này đang có một vấn đề khác đang theo dõi.',
      });
  };
  return { ...writer, values, change, submit, continueExisting, error: validation ?? writer.error };
}
