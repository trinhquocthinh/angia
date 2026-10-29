import type { FamilyUsage } from '@angia/contracts';
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
    <div role="status" className="flex flex-col gap-2 rounded-xl bg-[#fff4e5] p-3 text-sm text-[#5c3b00]">
      <p className="m-0">{messages[reason]}</p>
      <p className="m-0">
        Ảnh xếp hàng chờ chỉ được nhận diện khi quản trị viên cấp đủ lượt và ngân sách hệ thống đã được xác
        nhận còn khả dụng. Lượt không tự gia hạn. Bạn có thể chọn “Tôi tự nhập” để nhập ngay.
      </p>
    </div>
  );
}
