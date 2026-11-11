import { PrivacyToolIcon } from './PrivacyToolIcon';
export function PrivacyStudioHeading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 border-b border-border/30 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="privacy-studio-title flex min-w-0 items-center gap-2 text-[22px] leading-7 text-accent">
          <span className="text-accent">
            <PrivacyToolIcon name="crop" />
          </span>
          Cắt và che thông tin định danh
        </h3>
        <span className="flex shrink-0 items-center gap-1 self-start rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent sm:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Đang chỉnh sửa
        </span>
      </div>
      <p className="text-[13px] leading-5 text-text-secondary">
        Chỉ giữ nội dung cần đọc. Che họ tên, số điện thoại và địa chỉ bằng vùng đen đặc. Ảnh chưa được gửi để
        tự động nhận diện.
      </p>
    </div>
  );
}
