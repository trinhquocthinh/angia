import { DocumentIcon } from './DocumentIcon';

// Chỉ đếm vùng người dùng đã vẽ: hệ thống không tự kiểm được ảnh đã hết thông tin định danh hay chưa.
export function RedactionConfirmHeading({ maskCount }: { maskCount: number }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#bfc9c4]/30 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="auth-heading text-2xl font-semibold leading-8 text-[#004135]">Xem bản sẽ tải lên</h3>
        <p className="mt-1 text-[15px] leading-6 text-[#404945]">
          Đây là đúng ảnh sẽ được gửi đi. AN GIA không nhận ảnh chưa che.
        </p>
      </div>
      {maskCount > 0 ? (
        <span className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-[#aef0da] px-3 py-1.5 text-xs font-semibold text-[#004135] sm:self-auto">
          <DocumentIcon name="checkCircle" size={16} /> Đã che {maskCount} vùng
        </span>
      ) : (
        <span className="shrink-0 self-start rounded-full bg-[#e4f0f0] px-3 py-1.5 text-xs font-semibold text-[#404945] sm:self-auto">
          Chưa có vùng che
        </span>
      )}
    </div>
  );
}
