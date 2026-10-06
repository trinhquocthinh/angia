import type { Account } from '../../application/ports';
import { AdminIcon } from './AdminIcon';

export function SidebarMembers({ members }: { members: Account[] }) {
  return (
    <section className="pt-1 px-1 pb-0 max-[900px]:hidden" aria-labelledby="sidebar-members-title">
      <div className="flex justify-between items-center pr-2 text-[#286958]">
        <h2
          className="text-[11px] leading-[14px] tracking-[0.05em] uppercase text-[#707975] font-semibold py-1 px-2 m-0 max-[900px]:hidden"
          id="sidebar-members-title"
        >
          Thành viên
        </h2>
        <AdminIcon name="person_add" size={18} />
      </div>
      {members.length === 0 ? (
        <p className="my-1 mx-2 text-[11px] leading-[18px] text-[#707975]">
          Chưa có tài khoản trong nhóm của bạn.
        </p>
      ) : (
        members.map((member, index) => (
          <div
            className="admin-member flex items-center gap-2 p-2 text-[13px] leading-[20px] rounded-[12px] text-[#404945] [&_>_span:last-child]:overflow-hidden [&_>_span:last-child]:text-ellipsis [&_>_span:last-child]:whitespace-nowrap"
            key={member.id}
          >
            <span
              className={`w-6 h-6 rounded-full bg-[#aef0da] text-[#055141] inline-flex items-center justify-center text-[11px] font-semibold shrink-0 ${index % 3 === 1 ? 'bg-[#b4eedc]! text-[#145042]!' : index % 3 === 2 ? 'bg-[#ffdbc9]! text-[#753400]!' : ''}`}
            >
              {member.displayName.slice(0, 1).toLocaleUpperCase('vi')}
            </span>
            <span>{member.displayName}</span>
          </div>
        ))
      )}
    </section>
  );
}
