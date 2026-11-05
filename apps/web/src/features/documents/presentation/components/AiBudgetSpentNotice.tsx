import type { FamilyUsage } from '@angia/contracts';
import { PrivacyToolIcon } from './PrivacyToolIcon';
const messages = {
  scan_quota_exhausted: 'Gia đình chưa có lượt nhận diện khả dụng trong tháng này.',
  budget_exhausted: 'Hệ thống tạm hết ngân sách nhận diện ảnh.',
  billing_unavailable: 'Hệ thống đang xác nhận dữ liệu phí, tạm dừng nhận diện ảnh.',
};
// SPEC-031: giải thích khi gửi tự động nhận diện chỉ còn là xếp hàng chờ.
export function AiBudgetSpentNotice({
  reason = 'scan_quota_exhausted',
}: {
  reason?: FamilyUsage['aiOcr']['reason'];
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl bg-[#fff1ea] p-3 text-[13px] leading-5 text-[#602900]"
    >
      <span className="mt-0.5">
        <PrivacyToolIcon name="info" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="m-0 font-bold">{messages[reason]}</p>
        <p className="m-0">
          Ảnh xếp hàng chờ chỉ được nhận diện khi quản trị viên cấp đủ lượt và ngân sách hệ thống đã được xác
          nhận còn khả dụng. Lượt không tự gia hạn. Bạn có thể chọn “Tôi tự nhập” để nhập ngay.
        </p>
      </div>
    </div>
  );
}
