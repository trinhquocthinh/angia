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
      className="profile-bento-card flex min-w-0 flex-col gap-4 p-5 sm:p-6"
      aria-labelledby="families-title"
    >
      <AdminCardHeading
        id="families-title"
        icon={<AdminIcon name="family_restroom" />}
        title="Nhóm gia đình"
        aside={
          <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container tabular-nums">
            {families.length} nhóm
          </span>
        }
      />
      {families.length === 0 ? (
        <p className="m-0 text-caption text-text-secondary">Chưa có nhóm gia đình nào</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
