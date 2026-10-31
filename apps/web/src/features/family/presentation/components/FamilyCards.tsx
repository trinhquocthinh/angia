import type { Account, Family } from '../../application/ports';
import { AdminCardHeading } from './AdminCardHeading';
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
      className="admin-panel flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm max-[600px]:p-4 admin-reveal"
      aria-labelledby="families-title"
    >
      <AdminCardHeading
        id="families-title"
        icon={<AdminIcon name="family_restroom" />}
        title="Nhóm gia đình"
        aside={
          <span className="shrink-0 rounded-full bg-[#aef0da]/60 px-2.5 py-1 text-xs font-semibold text-[#004135]">
            {families.length} nhóm
          </span>
        }
      />
      {families.length === 0 ? (
        <p className="m-0 text-[13px] leading-5 text-[#55615f]">Chưa có nhóm gia đình nào</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
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
