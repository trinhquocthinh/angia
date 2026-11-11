import { useState } from 'react';
import type { AdminScanQuotaView, GrantScanQuotasRequest } from '@angia/contracts';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { ScanQuotaGrantForm } from './ScanQuotaGrantForm';
export function ScanQuotaEditor({
  initial,
  pending,
  error,
  saved,
  onGrant,
}: {
  initial: AdminScanQuotaView;
  pending: boolean;
  error: Error | null;
  saved: boolean;
  onGrant(input: GrantScanQuotasRequest): Promise<unknown>;
}) {
  const [snapshot] = useState(initial);
  return (
    <div className="grid min-w-0 gap-3 border-t border-border pt-4">
      <p className="m-0 text-xs text-text-secondary">Bản sửa tháng {snapshot.month}</p>
      {error && (
        <p role="alert" className="m-0 text-[12px] text-danger">
          {error instanceof AdminRequestError
            ? error.message
            : 'Không thể lưu hạn mức. Bản đang sửa vẫn được giữ lại.'}
        </p>
      )}
      {saved && (
        <p role="status" className="m-0 text-[12px] text-accent">
          Đã lưu hạn mức lượt.
        </p>
      )}
      <ScanQuotaGrantForm initial={snapshot} pending={pending} onSave={onGrant} />
    </div>
  );
}
