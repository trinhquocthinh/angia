import { revealStyle } from '@src/shared/ui/revealStyle';
import { DocumentIcon } from './DocumentIcon';
// Không dùng các tuyên bố trong bản Stitch chưa đúng thực tế (mã hóa đầu cuối, AI nội bộ, mã phiên, chuẩn HL7, tên gói).
export function UploadIntro() {
  return (
    <>
      <div className="angia-modal-reveal flex flex-col gap-1.5" style={revealStyle(0)}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#286958]">
          <DocumentIcon name="shield" size={16} /> Sổ sức khỏe gia đình
        </p>
        <h1 className="auth-heading text-[28px] font-semibold leading-tight tracking-tight text-[#004135] sm:text-4xl">
          Thêm giấy tờ
        </h1>
        <p className="max-w-4xl text-[15px] leading-6 text-[#404945]">
          Ảnh đơn thuốc, kết quả xét nghiệm hoặc màn hình máy đo được lưu riêng trong sổ của gia đình. Thông
          tin trên ảnh sẽ được đọc và chờ bạn duyệt trước khi ghi vào hồ sơ.
        </p>
      </div>
      <section
        className="angia-modal-reveal flex items-start gap-3 rounded-2xl bg-[#aef0da]/40 p-4 sm:items-center"
        style={revealStyle(1)}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#286958] text-white shadow-sm">
          <DocumentIcon name="lock" size={18} />
        </span>
        <p className="text-[15px] leading-6 text-[#131d1d]">
          <strong className="font-semibold text-[#004135]">Bảo vệ quyền riêng tư gia đình:</strong> Chỉ chụp
          thuốc, chỉ số, ngày. Không chụp họ tên, mã bệnh nhân hoặc số bảo hiểm y tế.
        </p>
      </section>
    </>
  );
}
