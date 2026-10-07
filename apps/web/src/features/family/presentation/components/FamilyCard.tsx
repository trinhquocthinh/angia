import type { Account, Family } from '../../application/ports';
import { AdminIcon } from './AdminIcon';

export function FamilyCard({
  family,
  accounts,
  currentFamilyId,
}: {
  family: Family;
  accounts: Account[];
  currentFamilyId: string | null;
}) {
  const members = accounts.filter((account) => account.familyId === family.id);
  return (
    <article className="admin-family-card p-4 bg-[#eaf6f5] rounded-[12px] flex flex-col gap-2 transition-[transform,background-color] duration-[180ms] ease-[ease] [&:hover]:bg-[#e4f0f0] [&:hover]:-translate-y-0.5 [&_p]:m-0 [&_p]:text-[12px] [&_p]:leading-[20px] [&_p]:text-[#707975] motion-reduce:[&:hover]:transform-none">
      <div className="admin-family-title flex items-center justify-between gap-2 [&_h3]:m-0 [&_h3]:text-[#004135] [&_h3]:text-[18px] [&_h3]:leading-[24px] [&_h3]:font-semibold [&_h3]:[overflow-wrap:anywhere]">
        <h3>{family.name}</h3>
        <span
          className={`py-0.5 px-2 rounded-full bg-[#ffdbc9] text-[#753400] text-[10px] leading-[14px] font-semibold whitespace-nowrap ${currentFamilyId === family.id ? 'bg-[#20594b]! text-white!' : ''}`}
        >
          {currentFamilyId === family.id ? 'Nhóm của bạn' : 'Gia đình'}
        </span>
      </div>
      <p className="">
        Tạo ngày {new Date(family.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
      </p>
      <div className="admin-family-stats flex flex-wrap gap-[6px] pt-1 [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-1 [&_>_span]:py-0.5 [&_>_span]:px-2 [&_>_span]:rounded-[4px] [&_>_span]:bg-white [&_>_span]:text-[11px] [&_>_span]:leading-[16px] [&_.admin-icon]:text-[#286958]">
        <span>
          <AdminIcon name="group" size={14} />
          {members.length} tài khoản
        </span>
        <span>
          <AdminIcon name="verified_user" size={14} />
          {members.filter((account) => account.role === 'main').length} Quản trị chính
        </span>
      </div>
      <p className="admin-family-members [&_strong]:text-[#131d1d] [&_strong]:font-medium">
        Thành viên:{' '}
        <strong>{members.map((member) => member.displayName).join(', ') || 'Chưa có thành viên'}</strong>
      </p>
      <div className="flex items-center gap-1 pt-3 text-[11px] leading-[14px] text-[#286958] mt-auto">
        <AdminIcon name="family_restroom" size={16} />
        <span>Nhóm gia đình</span>
      </div>
    </article>
  );
}
