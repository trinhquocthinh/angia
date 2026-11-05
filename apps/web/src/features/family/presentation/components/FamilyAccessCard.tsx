import { AdminCardHeading } from './AdminCardHeading';
import { AdminIcon } from './AdminIcon';

const TILE = 'flex flex-col gap-1.5 rounded-xl bg-[#eaf6f5]/70 p-4';
const TITLE = 'flex items-center gap-1.5 text-xs leading-4 font-semibold text-[#004135]';

// BR-003, BR-007: chỉ nêu quy tắc đang được hệ thống cưỡng chế.
export function FamilyAccessCard() {
  return (
    <section className="admin-panel flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm max-[600px]:p-4 admin-reveal">
      <AdminCardHeading icon={<AdminIcon name="shield" />} title="Phân quyền gia đình" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={TILE}>
          <p className={`m-0 ${TITLE}`}>
            <AdminIcon name="verified_user" size={16} /> Quản trị chính
          </p>
          <p className="m-0 text-[13px] leading-5 text-[#404945]">
            Tài khoản đầu tiên của nhóm phải là Quản trị chính. Nhóm luôn cần ít nhất một Quản trị chính để
            quản lý các thành viên.
          </p>
        </div>
        <div className={TILE}>
          <p className={`m-0 ${TITLE}`}>
            <AdminIcon name="admin_panel_settings" size={16} /> Quản trị hệ thống
          </p>
          <p className="m-0 text-[13px] leading-5 text-[#404945]">
            Chỉ tạo nhóm, gán tài khoản và đặt vai trò. Không đọc được dữ liệu sức khỏe của gia đình khác.
          </p>
        </div>
      </div>
    </section>
  );
}
