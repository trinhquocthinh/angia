import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

// BR-040: minh họa thông báo màn hình khóa trung tính, không giả trạng thái đã bật thông báo trên thiết bị.
export function ReminderDeviceLink() {
  return (
    <section aria-labelledby="reminder-device-title" className="reminder-card flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="reminder-section-tile" aria-hidden="true">
            <ProfileSectionIcon name="notifications" size={30} />
          </span>
          <div className="min-w-0">
            <h2
              id="reminder-device-title"
              className="auth-heading text-heading-2 font-semibold text-text-primary"
            >
              Thông báo trên thiết bị
            </h2>
            <p className="text-caption text-text-secondary">
              Kiểm tra quyền và bật thông báo trên thiết bị bạn đang dùng.
            </p>
          </div>
        </div>
        <span className="reminder-pill reminder-pill-muted">Bảo vệ riêng tư</span>
      </div>
      <div className="reminder-lockscreen-stage" aria-hidden="true">
        <p className="mb-2 px-1 text-caption font-semibold text-text-secondary tabular-nums">20:00</p>
        <div className="reminder-lockscreen-card">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
            <AdminIcon name="notifications" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-caption">
              <span className="font-bold text-accent">AN GIA</span>
              <span className="text-text-secondary">Bây giờ</span>
            </div>
            <p className="mt-0.5 text-body font-semibold text-text-primary">Đến giờ dùng thuốc</p>
          </div>
        </div>
      </div>
      <div className="reminder-callout text-caption">
        <AdminIcon name="shield" size={18} />
        <p>
          Thông báo trên màn hình khóa chỉ hiển thị “Đến giờ dùng thuốc”, không hiện tên người hay tên thuốc.
        </p>
      </div>
      <Link to="/notifications" className="reminder-secondary-link">
        <span>Cài đặt thông báo</span>
        <AdminIcon name="arrow_forward" size={18} />
      </Link>
    </section>
  );
}
