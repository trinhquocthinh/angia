import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { revealStyle } from '@src/shared/ui/revealStyle';

// Không dùng các tuyên bố trong bản Stitch chưa đúng thực tế (mã hóa đầu cuối, AI nội bộ, mã phiên, chuẩn HL7, tên gói).
export function UploadIntro() {
  return (
    <>
      <div className="angia-modal-reveal flex items-center gap-4" style={revealStyle(0)}>
        <span className="doc-clay-emblem" aria-hidden="true">
          <ProfileSectionIcon name="folder_open" size={42} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="inline-flex items-center gap-2 text-caption font-semibold tracking-wider text-secondary uppercase">
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
            Sổ tay chăm sóc gia đình
          </p>
          <h1 className="auth-heading text-heading-1 font-semibold tracking-tight text-accent sm:text-display">
            Thêm giấy tờ
          </h1>
          <p className="max-w-4xl text-body text-text-secondary">
            Ảnh đơn thuốc, kết quả xét nghiệm hoặc màn hình máy đo được lưu riêng trong sổ của gia đình. Thông
            tin trên ảnh sẽ được đọc và chờ bạn duyệt trước khi ghi vào hồ sơ.
          </p>
        </div>
      </div>
      <section
        className="angia-modal-reveal flex items-start gap-3.5 rounded-3xl border border-accent/18 bg-accent-soft p-4 shadow-stitch-sm sm:items-center sm:p-5"
        style={revealStyle(1)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-stitch-sm">
          <AdminIcon name="shield" size={20} />
        </span>
        <p className="text-body text-text-primary">
          <strong className="font-semibold text-accent">Bảo vệ quyền riêng tư gia đình:</strong> Chỉ chụp
          thuốc, chỉ số, ngày. Không chụp họ tên, mã bệnh nhân hoặc số bảo hiểm y tế.
        </p>
      </section>
    </>
  );
}
