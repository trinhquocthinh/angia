import { AdminIcon } from './AdminIcon';

export function FamilyAccessCard() {
  return (
    <section className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 admin-access-panel p-5 [&_h2]:text-[16px] [&_p]:mt-3 [&_p]:mx-0 [&_p]:mb-0 [&_p]:text-[#404945] [&_p]:text-[13px] [&_p]:leading-[20px] max-[600px]:p-4 admin-reveal">
      <div className="admin-heading-with-count flex items-center gap-2 text-[#286958] [&_h2]:text-[#131d1d]">
        <AdminIcon name="shield" />
        <h2>Phân quyền gia đình</h2>
      </div>
      <p>Tài khoản đầu tiên của nhóm phải là Quản trị chính.</p>
      <p>Nhóm luôn cần ít nhất một Quản trị chính để quản lý các thành viên.</p>
    </section>
  );
}
