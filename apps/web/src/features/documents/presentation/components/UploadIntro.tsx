import { DocumentIcon } from './DocumentIcon';
// Không dùng các tuyên bố trong bản Stitch chưa đúng thực tế (mã hóa đầu cuối, AI nội bộ, mã phiên).
export function UploadIntro() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#286958]">
          <DocumentIcon name="upload" size={16} /> Hồ sơ điện tử · Cập nhật mới
        </p>
        <h1 className="auth-heading text-[28px] font-semibold leading-tight text-[#004135]">Thêm giấy tờ</h1>
        <p className="text-[15px] leading-6 text-[#404945]">
          Ảnh đơn thuốc, kết quả xét nghiệm hoặc màn hình máy đo được lưu riêng trong sổ của gia đình. Thông
          tin trên ảnh sẽ được đọc và chờ bạn duyệt trước khi ghi vào hồ sơ.
        </p>
      </div>
      <section className="flex items-start gap-3 rounded-xl bg-[#aef0da]/40 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#286958] text-white">
          <DocumentIcon name="lock" size={18} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[#2f6f5e]">Bảo vệ quyền riêng tư gia đình</h2>
          <p className="mt-1 text-[15px] leading-6 text-[#404945]">
            Chỉ chụp thuốc, chỉ số, ngày. Không chụp họ tên, mã bệnh nhân hoặc số bảo hiểm y tế.
          </p>
        </div>
      </section>
    </>
  );
}
