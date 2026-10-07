import type { Account, Family } from '../../application/ports';
import { AdminIcon } from './AdminIcon';
import { FamilyCard } from './FamilyCard';

export function FamilyCards({
  families,
  accounts,
  currentFamilyId,
}: {
  families: Family[];
  accounts: Account[];
  currentFamilyId: string | null;
}) {
  return (
    <section
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:text-[18px] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 p-5 max-[600px]:p-4 admin-reveal"
      aria-labelledby="families-title"
    >
      <div className="admin-heading-with-count flex items-center gap-2 text-[#286958] [&_h2]:text-[#131d1d]">
        <AdminIcon name="family_restroom" size={22} />
        <h2 id="families-title">Nhóm gia đình liên kết</h2>
        <span className="inline-flex items-center justify-center min-w-6 h-6 py-0 px-2 rounded-full bg-[#deebea] text-[12px] font-semibold text-[#404945]">
          {families.length}
        </span>
      </div>
      {families.length === 0 ? (
        <p className="py-4 px-5 m-0 text-[#707975] text-[13px] leading-[20px]">Chưa có nhóm gia đình nào</p>
      ) : (
        <div className="grid grid-cols-[repeat(2,_minmax(0,_1fr))] gap-4 mt-4 max-[600px]:grid-cols-[minmax(0,_1fr)]">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              accounts={accounts}
              currentFamilyId={currentFamilyId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
