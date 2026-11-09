import { useState } from 'react';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import type { PainWorkspaceDialog } from './painJournalWorkspaceTypes';
export function usePainJournalDialogs(
  identity: string,
  onContinueIssue?: (result: PainIssueHandoff) => void,
) {
  const [opened, setOpened] = useState<{ key: string; dialog: PainWorkspaceDialog } | null>(null);
  const [notice, setNotice] = useState<{ key: string; message: string } | null>(null);
  const show = (dialog: PainWorkspaceDialog) => {
    setNotice(null);
    setOpened({ key: identity, dialog });
  };
  const saved = (message: string) => {
    setOpened(null);
    setNotice({ key: identity, message });
  };
  const handoff = (result: PainIssueHandoff) => {
    setOpened(null);
    if (onContinueIssue) onContinueIssue(result);
    else if (result.kind === 'existing') show({ kind: 'handoff', handoff: result });
    else saved('Đã mở vấn đề đau và lưu lần ghi đầu.');
  };
  return { opened, notice, show, saved, handoff, close: () => setOpened(null) };
}
