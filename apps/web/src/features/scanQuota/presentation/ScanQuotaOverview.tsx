import type { AdminScanQuotaView } from '@angia/contracts';
import { formatBillingUsd } from '@src/features/aiBilling/application/formatBillingUsd';
import { requiredCapIncreaseUsd } from '../application/requiredCapIncreaseUsd';

const BILLING = {
  ready: 'Đủ dữ liệu',
  incomplete: 'Thiếu dữ liệu phí',
  stale: 'Dữ liệu phí đã cũ',
  unconfigured: 'Chưa cấu hình nguồn phí',
};
const TILE = 'min-w-0 rounded-xl bg-[#eaf6f5]/70 p-3';
const LABEL = 'text-xs leading-4 text-[#404945]';
const VALUE = 'auth-heading m-0 mt-0.5 text-2xl leading-8 font-semibold text-[#004135] tabular-nums';

// Trần và phí thực đã có ở thẻ "Chi phí AI" nên không lặp lại ở đây.
export function ScanQuotaOverview({ view }: { view: AdminScanQuotaView }) {
  const available = view.availableAdditionalScans;
  return (
    <div className="grid gap-2 text-[12px] leading-5 text-[#404945]">
      <dl className="m-0 grid grid-cols-2 gap-2">
        <div className={TILE}>
          <dt className={LABEL}>Lượt cam kết còn lại</dt>
          <dd className={VALUE}>{view.committedRemainingScans}</dd>
        </div>
        <div className={TILE}>
          <dt className={LABEL}>Có thể cấp thêm</dt>
          <dd className={available === null ? 'm-0 mt-0.5 text-[13px] leading-8 font-semibold' : VALUE}>
            {available ?? 'Chưa xác định'}
          </dd>
        </div>
      </dl>
      <p className="m-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-[#e4f0f0] px-3 py-2">
        <span>Đối soát phí</span>
        <span className="font-semibold text-[#004135]">{BILLING[view.billingStatus]}</span>
      </p>
      {view.policy && (
        <p className="m-0 text-[#55615f]">
          Mặc định {view.policy.trialScans} lượt/gia đình/tháng · dự phòng{' '}
          {view.policy.reserveBasisPoints / 100}% · ước tính{' '}
          {formatBillingUsd(view.policy.estimatedCostPerScanUsd)}/lượt
        </p>
      )}
      {view.billingStatus !== 'ready' && (
        <p role="status" className="m-0 text-[#55615f]">
          Cần phí thực đầy đủ và còn mới để máy chủ duyệt cấp lượt. Lượt đã cấp được giữ nguyên.
        </p>
      )}
      {view.overAllocatedScans !== null && view.overAllocatedScans !== '0' && (
        <p role="alert" className="m-0 rounded-xl bg-[#ffdad6] px-3 py-2 text-[#93000a]">
          Đang cấp vượt khả năng ngân sách {view.overAllocatedScans} lượt; cần nâng trần tháng thêm khoảng{' '}
          {view.policy
            ? formatBillingUsd(requiredCapIncreaseUsd(view.policy, Number(view.overAllocatedScans)))
            : 'chưa xác định'}
          . Hạn mức đã cấp không tự giảm.
        </p>
      )}
    </div>
  );
}
