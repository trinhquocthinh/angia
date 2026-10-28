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
    <div className="grid min-w-0 gap-5">
      <p className="m-0 text-[11px] text-[#707975]">
        Bản sửa tháng {snapshot.month} · phiên bản {snapshot.version}
      </p>
      {error && (
        <p role="alert" className="m-0 text-[12px] text-[#93000a]">
          {error instanceof AdminRequestError
            ? error.message
            : 'Không thể lưu hạn mức. Bản đang sửa vẫn được giữ lại.'}
        </p>
      )}
      {saved && (
        <p role="status" className="m-0 text-[12px] text-[#055141]">
          Đã lưu hạn mức lượt.
        </p>
      )}
      <ScanQuotaGrantForm initial={snapshot} pending={pending} onSave={onGrant} />
    </div>
  );
}
