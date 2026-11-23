import { useEffect, useRef, useState } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { formatTempPasswordExpiry } from '../../application/formatTempPasswordExpiry';
import type { TemporaryPasswordResult } from '../../application/memberPorts';
import { MemberResetIcon } from './MemberResetIcon';

type Props = {
  titleId: string;
  displayName: string;
  result: TemporaryPasswordResult;
  onClose: () => void;
};

export function ResetMemberPasswordResult({ titleId, displayName, result, onClose }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="member-reset-header">
        <div className="member-reset-badge member-reset-badge-success" aria-hidden="true">
          <MemberResetIcon name="member-reset-check-circle" size={24} />
        </div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1}>
          Mật khẩu tạm của {displayName}
        </h2>
      </div>
      <div className="member-reset-code-card">
        <div className="member-reset-code-row">
          <code className="member-reset-code" data-testid="temporary-password">
            {result.temporaryPassword}
          </code>
          <button type="button" className="member-reset-copy-btn" onClick={() => void handleCopy()}>
            <MemberResetIcon name="member-reset-copy" size={16} />
            <span>Sao chép</span>
          </button>
        </div>
        <p className="member-reset-copy-status" role="status" aria-live="polite" aria-atomic="true">
          {copied ? 'Đã sao chép' : ''}
        </p>
      </div>
      <p className="member-reset-expiry">
        <MemberResetIcon name="member-reset-alert-circle" size={16} />
        <span>{formatTempPasswordExpiry(result.expiresAt)}</span>
      </p>
      <Button className="member-reset-done-btn" onClick={onClose}>
        Xong
      </Button>
    </>
  );
}
