import type { AdminScanQuotaView } from '@angia/contracts';
type Family = AdminScanQuotaView['families'][number];
export function ScanQuotaFamilyDetails({ family }: { family: Family }) {
  const status = {
    unconfigured: 'Chưa cấp lượt',
    default: 'Mặc định',
    trial: 'Dùng thử',
    approved: 'Đã duyệt',
  };
  return (
    <>
      <p className="m-0 text-[12px] leading-5 text-text-secondary">
        <span className="font-semibold text-accent">{status[family.quota.status]}</span> · Đã cấp{' '}
        {family.quota.grantedScans} · Đã dùng {family.quota.usedScans} · Đang giữ {family.quota.heldScans} ·
        Còn lại {family.quota.remainingScans} lượt
      </p>
      <p className="m-0 text-[12px] leading-5 text-text-secondary">
        {family.previousApprovedScans === null
          ? 'Không có mức duyệt tháng trước.'
          : `Tháng trước đã duyệt: ${family.previousApprovedScans} lượt. Chỉ là gợi ý; cần chọn và xác nhận lại.`}
      </p>
    </>
  );
}
