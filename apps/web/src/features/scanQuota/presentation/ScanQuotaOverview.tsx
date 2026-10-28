import type { AdminScanQuotaView } from '@angia/contracts';
import { formatBillingUsd } from '@src/features/aiBilling/application/formatBillingUsd';
import { requiredCapIncreaseUsd } from '../application/requiredCapIncreaseUsd';
export function ScanQuotaOverview({ view }: { view: AdminScanQuotaView }) {
  const billing = {
    ready: 'Đủ dữ liệu',
    incomplete: 'Thiếu dữ liệu phí',
    stale: 'Dữ liệu phí đã cũ',
    unconfigured: 'Chưa cấu hình nguồn phí',
  };
  return (
    <div className="grid gap-2 text-[12px] leading-5 text-[#404945]">
      <p className="m-0 font-semibold">
        Tháng {view.month} · phiên bản {view.version}
      </p>
      <p className="m-0">Trần tháng: {formatBillingUsd(view.monthlyCapUsd)}</p>
      <p className="m-0">
        Phí thực: {view.actualSpendUsd === null ? 'Chưa xác định' : formatBillingUsd(view.actualSpendUsd)}
      </p>
      <p className="m-0">Đối soát: {billing[view.billingStatus]}</p>
      <p className="m-0">Lượt cam kết còn lại: {view.committedRemainingScans}</p>
      <p className="m-0">
        {view.availableAdditionalScans === null
          ? 'Chưa thể xác định lượt cấp thêm'
          : `Có thể cấp thêm: ${view.availableAdditionalScans} lượt`}
      </p>
      {view.policy && (
        <p className="m-0">
          Mặc định {view.policy.trialScans} lượt/gia đình/tháng · dự phòng{' '}
          {view.policy.reserveBasisPoints / 100}% · ước tính{' '}
          {formatBillingUsd(view.policy.estimatedCostPerScanUsd)}/lượt
        </p>
      )}
      {view.billingStatus !== 'ready' && (
        <p role="status" className="m-0">
          Cần phí thực đầy đủ và còn mới để máy chủ duyệt cấp lượt. Lượt đã cấp được giữ nguyên.
        </p>
      )}
      {view.overAllocatedScans !== null && view.overAllocatedScans !== '0' && (
        <p role="alert" className="m-0 text-[#93000a]">
          Đang cấp vượt khả năng ngân sách {view.overAllocatedScans} lượt; cần nâng chi phí cố định tháng thêm
          khoảng{' '}
          {view.policy
            ? formatBillingUsd(requiredCapIncreaseUsd(view.policy, Number(view.overAllocatedScans)))
            : 'chưa xác định'}
          . Hạn mức đã cấp không tự giảm.
        </p>
      )}
    </div>
  );
}
