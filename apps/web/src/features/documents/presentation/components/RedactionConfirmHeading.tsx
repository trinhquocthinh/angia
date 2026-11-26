import { DocumentIcon } from './DocumentIcon';

// Chỉ đếm vùng người dùng đã vẽ: hệ thống không tự kiểm được ảnh đã hết thông tin định danh hay chưa.
export function RedactionConfirmHeading({ maskCount }: { maskCount: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/30 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="doc-clay-tile text-accent">
          <DocumentIcon name="shield" size={22} />
        </span>
        <div className="min-w-0">
          <h3 className="auth-heading text-heading-2 font-semibold text-accent">Xem bản sẽ tải lên</h3>
          <p className="mt-1 text-caption text-text-secondary">
            Đây là đúng ảnh sẽ được gửi đi. AN GIA không nhận ảnh chưa che.
          </p>
        </div>
      </div>
      {maskCount > 0 ? (
        <span className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-secondary-container px-3.5 py-1.5 text-caption font-semibold text-on-secondary-container sm:self-auto">
          <DocumentIcon name="checkCircle" size={16} /> Đã che {maskCount} vùng
        </span>
      ) : (
        <span className="shrink-0 self-start rounded-full bg-accent-soft px-3.5 py-1.5 text-caption font-semibold text-text-secondary sm:self-auto">
          Chưa có vùng che
        </span>
      )}
    </div>
  );
}
