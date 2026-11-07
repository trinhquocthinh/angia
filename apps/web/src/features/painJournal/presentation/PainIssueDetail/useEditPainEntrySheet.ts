import { useState } from 'react';
import type { PainEntry, PainIssueDetail } from '@angia/contracts';
import { editPainEntryForm } from '../../application/editPainEntryForm';
import { useEditPainEntry } from '../../application/useEditPainEntry';
import type { PainIssueDetailProps } from './painIssueDetailTypes';

export type EditPainEntryProps = Omit<PainIssueDetailProps, 'api'> & {
  api: NonNullable<PainIssueDetailProps['api']>;
  issue: PainIssueDetail;
  entry: PainEntry;
  onClose: () => void;
  onSaved: (message: string) => void;
};
export function useEditPainEntrySheet(props: EditPainEntryProps) {
  const [values, setValues] = useState(() => ({
    title: '',
    level: props.entry.level as number | null,
    note: props.entry.note ?? '',
    recordedAt: new Date(Date.parse(props.entry.recordedAt) + 7 * 3_600_000).toISOString().slice(0, 16),
  }));
  const [validation, setValidation] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const writer = useEditPainEntry(props.api, props.session, props.profile, props.scope, props.issueId);
  const change = (patch: Partial<typeof values>) => {
    setValues((v) => ({ ...v, ...patch }));
    setValidation(null);
  };
  const save = async () => {
    let body;
    try {
      body = editPainEntryForm(values, props.issue.resolvedOn, new Date(), props.entry.recordedAt);
    } catch (cause) {
      setValidation(
        cause instanceof Error && !('issues' in cause)
          ? cause.message
          : 'Kiểm tra mức đau, ghi chú và thời điểm hợp lệ, không ở tương lai.',
      );
      return;
    }
    if (await writer.save(props.entry.id, body)) props.onSaved('Đã sửa lần ghi.');
  };
  const remove = async () => {
    if (props.issue.entries.length <= 1 || writer.lastEntry) return;
    if (await writer.remove(props.entry.id)) props.onSaved('Đã xóa lần ghi.');
  };
  return {
    ...writer,
    values,
    change,
    save,
    remove,
    confirmDelete,
    setConfirmDelete,
    canDelete: props.issue.entries.length > 1 && !writer.lastEntry,
    error: validation ?? writer.error,
  };
}
