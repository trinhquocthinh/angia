import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function PrivacyStudioHeading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/35 pb-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="doc-clay-tile-sm text-accent" aria-hidden="true">
            <AdminIcon name="shield" size={20} />
          </span>
          <h3 className="privacy-studio-title min-w-0 text-heading-2 text-accent">
            Cắt và che thông tin định danh
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Đang chỉnh sửa
        </span>
      </div>
      <p className="flex items-start gap-2 rounded-2xl border border-accent/18 bg-accent-soft px-3.5 py-2.5 text-caption text-text-primary">
        <span className="mt-0.5 text-accent">
          <AdminIcon name="shield" size={16} />
        </span>
        <span>
          Chỉ giữ nội dung cần đọc. Che họ tên, số điện thoại và địa chỉ bằng vùng đen đặc. Ảnh chưa được gửi
          để tự động nhận diện.
        </span>
      </p>
    </div>
  );
}
