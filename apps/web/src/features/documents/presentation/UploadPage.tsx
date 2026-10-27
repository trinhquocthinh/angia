import { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import { createScanQuotaRepository } from '@src/features/scanQuota/infrastructure/createScanQuotaRepository';
import { useState } from 'react';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { compressImage } from '@src/shared/utils/image/compressImage';
import { createBrowserImageCodec } from '@src/shared/utils/image/createBrowserImageCodec';
import type { ImagePreparer } from '../application/ports';
import { useFamilyUsage } from '../application/useFamilyUsage';
import { createFamilyUsageRepository } from '../infrastructure/createFamilyUsageRepository';
import { createXhrDocumentUploader } from '../infrastructure/createXhrDocumentUploader';
import { dismissPrivacyReminder, shouldShowPrivacyReminder } from '../infrastructure/privacyReminderStorage';
import { UploadPrivacyReminder } from './components/UploadPrivacyReminder';
import { UploadWorkspace } from './components/UploadWorkspace';

const scanQuotaRepository = createScanQuotaRepository();
const profilesRepository = createProfilesRepository();
const uploader = createXhrDocumentUploader();
const usageRepository = createFamilyUsageRepository();
const imageCodec = createBrowserImageCodec();
const prepareImage: ImagePreparer = (file) => compressImage(file, imageCodec);

export function UploadPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  // BR-041 bổ sung: nhắc không chụp thông tin cá nhân mỗi lần mở trang, trừ khi đã chọn "Không nhắc lại".
  const [reminder, setReminder] = useState(() => shouldShowPrivacyReminder());
  const usage = useFamilyUsage(usageRepository, session.data?.role === 'main');
  const quotaSession = session.data?.role === 'main' ? session.data : null;
  const scanQuota = useFamilyScanQuota(
    scanQuotaRepository,
    quotaSession?.account.id ?? null,
    quotaSession?.family?.id ?? null,
  );
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <div className="mx-auto flex w-full flex-col gap-6">
        {main && reminder && (
          <UploadPrivacyReminder
            onClose={(dontRemind) => {
              if (dontRemind) dismissPrivacyReminder();
              setReminder(false);
            }}
          />
        )}
        {main ? (
          <UploadWorkspace
            uploader={uploader}
            prepare={prepareImage}
            csrfToken={session.data.csrfToken}
            profiles={profiles}
            usage={usage.data ?? null}
            scanQuota={scanQuota}
            loading={workspace.profiles.isPending}
            error={workspace.profiles.isError}
            retry={() => void workspace.profiles.refetch()}
          />
        ) : (
          <RecipientNotice />
        )}
      </div>
    </ProfileFrame>
  );
}
