import { AdminIcon } from './AdminIcon';

const TILE = 'flex flex-col gap-1.5 rounded-2xl border border-on-accent/20 bg-on-accent/10 p-4';
const TITLE = 'flex items-center gap-1.5 text-caption font-semibold text-on-accent';

// BR-003, BR-007: chỉ nêu quy tắc đang được hệ thống cưỡng chế.
export function FamilyAccessCard() {
  return (
    <section className="relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-[24px] bg-accent p-5 text-on-accent shadow-stitch-md sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-on-accent/10"
      />
      <div className="relative z-10 flex flex-col gap-1">
        <p className="m-0 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-on-accent/90">
          <AdminIcon name="shield" size={18} /> Bảo mật &amp; Phân quyền
        </p>
        <h2 className="auth-heading m-0 text-heading-2 font-semibold text-on-accent">Phân quyền gia đình</h2>
      </div>
      <div className="relative z-10 grid grid-cols-1 gap-3">
        <div className={TILE}>
          <p className={`m-0 ${TITLE}`}>
            <AdminIcon name="verified_user" size={16} /> Quản trị chính
          </p>
          <p className="m-0 text-caption text-on-accent/90">
            Tài khoản đầu tiên của nhóm phải là Quản trị chính. Nhóm luôn cần ít nhất một Quản trị chính để
            quản lý các thành viên.
          </p>
        </div>
        <div className={TILE}>
          <p className={`m-0 ${TITLE}`}>
            <AdminIcon name="admin_panel_settings" size={16} /> Quản trị hệ thống
          </p>
          <p className="m-0 text-caption text-on-accent/90">
            Chỉ tạo nhóm, gán tài khoản và đặt vai trò. Không đọc được dữ liệu sức khỏe của gia đình khác.
          </p>
        </div>
      </div>
    </section>
  );
}
