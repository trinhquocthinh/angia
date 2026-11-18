import type { SubmitEvent } from 'react';
import type { CurrentLegal } from '../application/ports';
import { AccountLogout } from './AccountLogout';
import { FormAlert } from './FormAlert';
import { LegalUpdateLayout } from './LegalUpdateLayout';
import { LegalUpdateIcon } from './LegalUpdateIcon';
import { LegalUpdateDocumentLink } from './LegalUpdateDocumentLink';
import { LegalUpdateSubmit } from './LegalUpdateSubmit';

type Props = {
  legal: CurrentLegal | null;
  loading: boolean;
  token: string;
  busy: boolean;
  error: string | null;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

export function LegalUpdateView({ legal, loading, token, busy, error, onSubmit }: Props) {
  return (
    <LegalUpdateLayout
      footer={
        <AccountLogout
          token={token}
          heading="Nếu chưa muốn đồng ý"
          icon={<LegalUpdateIcon name="logout" />}
        />
      }
    >
      <div className="legal-update-heading">
        <h2 id="legal-update-title">Điều khoản đã thay đổi</h2>
        <span className="legal-update-badge">
          <LegalUpdateIcon name="badge" />
          Bản cập nhật
        </span>
      </div>
      <div className="legal-update-copy">
        <p>Chúng tôi cập nhật cách lưu và xử lý dữ liệu sức khỏe của gia đình.</p>
        <p>Bạn cần đồng ý bản mới để tiếp tục dùng AN GIA.</p>
      </div>
      <div className="legal-update-documents">
        {legal && (
          <>
            <LegalUpdateDocumentLink document={legal.terms} label="Điều khoản sử dụng" icon="document" />
            <LegalUpdateDocumentLink
              document={legal.privacy}
              label="Chính sách quyền riêng tư"
              icon="privacy"
            />
          </>
        )}
      </div>
      <form className="legal-update-form" onSubmit={(event) => void onSubmit(event)} aria-busy={busy}>
        <LegalUpdateSubmit busy={busy} disabled={!token || !legal || loading} />
        <FormAlert message={error} />
      </form>
      <p className="legal-update-note">
        <LegalUpdateIcon name="clock" />
        Bạn có thể đọc đầy đủ từng văn bản trước khi đồng ý.
      </p>
    </LegalUpdateLayout>
  );
}
