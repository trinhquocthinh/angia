import { PrivacyToolIcon } from './PrivacyToolIcon';
export function PrivacyStudioHeading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 border-b border-[#bfc9c4]/30 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="privacy-studio-title flex min-w-0 items-center gap-2 text-[22px] leading-7 text-[#004135]">
          <span className="text-[#286958]">
            <PrivacyToolIcon name="crop" />
          </span>
          Cắt và che thông tin định danh
        </h3>
        <span className="flex shrink-0 items-center gap-1 self-start rounded-full bg-[#aef0da] px-2.5 py-1 text-[11px] font-semibold text-[#004135] sm:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-[#286958]" />
          Đang chỉnh sửa
        </span>
      </div>
      <p className="text-[13px] leading-5 text-[#404945]">
        Chỉ giữ nội dung cần đọc. Che họ tên, số điện thoại và địa chỉ bằng vùng đen đặc. Ảnh chưa được gửi để
        tự động nhận diện.
      </p>
    </div>
  );
}
