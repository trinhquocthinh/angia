import { useState } from 'react';
import type { DocumentEntry } from '@angia/contracts';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import type { EntryTypeFilter } from '../application/documentEntryPorts';
import { useDocumentEntries } from '../application/useDocumentEntries';
import { createReviewRepository } from '../infrastructure/createReviewRepository';
import { DeletedDocumentNotice } from './components/DeletedDocumentNotice';
import { createDocumentEntriesRepository } from '../infrastructure/createDocumentEntriesRepository';
import { DocumentEntryList } from './entries/DocumentEntryList';
import { DocumentEntryPanel } from './entries/DocumentEntryPanel';
import { DocumentTypeFilter } from './entries/DocumentTypeFilter';
import { ReusePrescriptionSheet } from './entries/ReusePrescriptionSheet';

const reviewRepository = createReviewRepository();
const entriesRepository = createDocumentEntriesRepository();

// Tab "Hồ sơ & Giấy tờ khám" (E5-S4-T1): danh mục chứng từ + bản nhập tay (SPEC-028), Dùng lại đơn (SPEC-029).
export function DocumentsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <DocumentsContent profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}

function DocumentsContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const [deleted, setDeleted] = useState(false);
  const [type, setType] = useState<EntryTypeFilter | undefined>();
  const [opened, setOpened] = useState<DocumentEntry | null>(null);
  const [reusing, setReusing] = useState<DocumentEntry | null>(null);
  const entries = useDocumentEntries(entriesRepository, session, profile, type);
  return (
    <div className="flex flex-col gap-6">
      {deleted && <DeletedDocumentNotice />}
      <ProfileHealthHeader profile={profile} active="documents" />
      <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#004135]">Hồ sơ & Giấy tờ khám</h2>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <>
          <DocumentTypeFilter value={type} onChange={setType} />
          <DocumentEntryList
            items={entries.data?.pages.flatMap((page) => page.items)}
            loading={entries.isPending}
            error={entries.isError}
            retry={() => void entries.refetch()}
            hasMore={entries.hasNextPage}
            loadingMore={entries.isFetchingNextPage}
            loadMore={() => void entries.fetchNextPage()}
            onOpen={setOpened}
          />
        </>
      )}
      {opened && !reusing && (
        <DocumentEntryPanel
          entry={opened}
          deletion={{
            repository: reviewRepository,
            session,
            profileId: profile.id,
            onDeleted: () => {
              setOpened(null);
              setDeleted(true);
            },
          }}
          canReuse={session.role === 'main'}
          onReuse={() => setReusing(opened)}
          onClose={() => setOpened(null)}
        />
      )}
      {reusing?.records.prescription && (
        <ReusePrescriptionSheet
          prescription={reusing.records.prescription}
          session={session}
          repository={entriesRepository}
          onClose={() => setReusing(null)}
        />
      )}
    </div>
  );
}
