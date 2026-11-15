import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { accountErrorMessage } from '../application/accountErrorMessage';
import { useLegalDocuments } from '../application/useLegalDocuments';
import { fetchCurrentLegal } from '../infrastructure/fetchCurrentLegal';
import { submitAccountAction } from '../infrastructure/submitAccountAction';
import { AccountLayout } from './AccountLayout';
import { AccountLogout } from './AccountLogout';
import { AccountSubmitButton } from './AccountSubmitButton';
import { FormAlert } from './FormAlert';
import { LegalDocumentLink } from './LegalDocumentLink';
export function LegalUpdatePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const documents = useLegalDocuments(fetchCurrentLegal);
  const client = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = session.data?.csrfToken ?? '';
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documents.legal || !token || busy || documents.loading) return;
    setBusy(true);
    setError(null);
    try {
      const { terms, privacy } = documents.legal;
      const result = await submitAccountAction(
        '/api/me/legal-acceptances',
        { versionIds: [terms.id, privacy.id] },
        token,
      );
      if (result.ok) {
        await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
        await navigate({ to: '/' });
      } else {
        setError(accountErrorMessage(result.code));
        if (result.code === 'ERR_LEGAL_VERSION_OUTDATED') await documents.refresh(result.current);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountLayout footer={<AccountLogout token={token} heading="Nếu chưa muốn đồng ý" />}>
      <h2 className="mb-4 text-[22px] leading-[30px] font-semibold">Điều khoản đã thay đổi</h2>
      <p className="mb-3 text-lg">Chúng tôi cập nhật cách lưu và xử lý dữ liệu sức khỏe của gia đình.</p>
      <p className="mb-6 text-lg">Bạn cần đồng ý bản mới để tiếp tục dùng AN GIA.</p>
      <div className="mb-6 border-t border-border">
        {documents.legal && (
          <>
            <LegalDocumentLink document={documents.legal.terms} label="Điều khoản sử dụng" />
            <LegalDocumentLink document={documents.legal.privacy} label="Chính sách quyền riêng tư" />
          </>
        )}
      </div>
      <form onSubmit={(event) => void submit(event)} aria-busy={busy} className="flex flex-col gap-4">
        <AccountSubmitButton
          busy={busy}
          disabled={!token || !documents.legal || documents.loading}
          label="Đồng ý và tiếp tục"
          pending="Đang gửi…"
        />
        <FormAlert message={documents.error ?? error} />
      </form>
    </AccountLayout>
  );
}
