import { PrivacyToolIcon } from './PrivacyToolIcon';
export function PrivacyStudioHeading() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="privacy-studio-title flex items-center gap-2 text-[22px] leading-7 sm:text-[24px] text-[#004135]">
          <PrivacyToolIcon name="crop" />
          Cắt và che thông tin định danh
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-[#404945]">
          Chỉ giữ nội dung cần đọc. Che họ tên, số điện thoại và địa chỉ bằng vùng đen đặc. Ảnh chưa được gửi
          tới AI.
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 self-start rounded-full bg-[#deebea] px-2.5 py-1 text-[11px] font-semibold text-[#286958]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#286958]" />
        Đang chỉnh sửa
      </span>
    </div>
  );
}
