import { useEffect, useState } from 'react';
import type { PainEntry } from '@angia/contracts';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { usePainIssueDetail } from '../../application/usePainIssueDetail';
import { canWritePainIssue } from '../../application/canWritePainIssue';
import { createPainJournalApi } from '../../infrastructure/painJournalApi';
import { PainIssueDetailView } from './PainIssueDetailView';
import type { PainIssueDetailProps } from './painIssueDetailTypes';
const defaultApi = createPainJournalApi();

export function PainIssueDetailContent(props: PainIssueDetailProps) {
  const api = props.api ?? defaultApi;
  const { session, profile, scope, issueId, onBack } = props;
  const query = usePainIssueDetail(api, session, profile, scope, issueId);
  const [editing, setEditing] = useState<PainEntry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const allowed = canWritePainIssue(session, profile, scope);
  const missing = query.error instanceof MedicationRequestError && query.error.status === 404;
  useEffect(() => {
    if (missing) onBack();
  }, [missing, onBack]);
  const saved = (message: string) => {
    setNotice(message);
    setEditing(null);
    setVersion((v) => v + 1);
  };
  if (profile.consentStatus !== 'confirmed') return <p role="alert">Hồ sơ chưa được đồng ý lưu dữ liệu.</p>;
  if (query.error)
    return (
      <div role="alert">
        <p>{missing ? 'Không tìm thấy vấn đề đau.' : 'Không thể tải vấn đề đau.'}</p>
        <button
          type="button"
          className="min-h-11 underline"
          onClick={() => {
            void query.refetch();
          }}
        >
          Thử lại
        </button>
        <button type="button" className="min-h-11 px-3 underline" onClick={onBack}>
          Về Đau nhức
        </button>
      </div>
    );
  if (!query.data)
    return (
      <p role="status" className="animate-pulse">
        Đang tải vấn đề đau…
      </p>
    );
  return (
    <PainIssueDetailView
      {...props}
      api={api}
      issue={query.data}
      editing={editing}
      notice={notice}
      version={version}
      allowed={allowed}
      saved={saved}
      exerciseSaved={setNotice}
      edit={(entry) => {
        setNotice(null);
        setEditing(entry);
      }}
    />
  );
}
