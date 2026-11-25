import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HealthProfile } from '../../application/ports';
import { formatWithdrawnAt } from '../../application/formatWithdrawnAt';

const labels = {
  pending: 'Chưa có xác nhận của người thân',
  invited: 'Đang chờ người thân xác nhận',
  declined: 'Lời mời đã bị từ chối',
  confirmed: 'Đã đồng ý chia sẻ',
  withdrawn: 'Người thân đã rút đồng thuận',
};

type Props = {
  profile: HealthProfile & {
    consentAction?: 'attestation' | 'self' | 'invitation' | null;
    consentConfirmedByName?: string | null;
  };
};

// Trạng thái đồng thuận gọn gàng (Bento v2.0): giữ đầy đủ ngữ nghĩa pháp lý nhưng nén gọn chữ.
export function ProfileConsentStatus({ profile }: Props) {
  const confirmed = profile.consentStatus === 'confirmed';
  const withdrawn = profile.consentStatus === 'withdrawn' || profile.consentStatus === 'declined';
  const tone = confirmed ? 'confirmed' : withdrawn ? 'danger' : 'warning';
  const metaParts = confirmed
    ? [
        profile.consentRespondentName
          ? `${profile.consentRespondentName}${profile.consentSource !== 'self' ? ' (chưa được xác minh)' : ''}`
          : null,
        profile.consentSource === 'main_attested'
          ? `Cam kết: ${profile.consentConfirmedByName ?? 'Không còn thông tin'}`
          : null,
        profile.consentConfirmedAt ? formatWithdrawnAt(profile.consentConfirmedAt) : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="mt-3.5 flex flex-col gap-1.5 rounded-2xl bg-accent-soft/80 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`profile-consent-pill profile-consent-pill-${tone} px-0 py-0 bg-transparent`}>
          <AdminIcon name={confirmed ? 'verified_user' : withdrawn ? 'info' : 'pending_actions'} size={17} />
          {labels[profile.consentStatus]}
        </span>
        {confirmed && profile.consentBasis === 'guardian' && (
          <span className="text-caption font-medium text-text-secondary">Giám hộ</span>
        )}
      </div>
      {confirmed && metaParts.length > 0 && (
        <p className="break-words text-caption text-text-secondary">{metaParts.join(' · ')}</p>
      )}
      {!confirmed && (
        <p className="text-caption text-text-secondary">
          {profile.consentAction === 'invitation'
            ? 'Cần chủ hồ sơ tự gỡ liên kết trước.'
            : profile.consentSource === 'legacy_attestation'
              ? 'Xác nhận cũ cần được xác nhận lại.'
              : 'Chưa thể ghi dữ liệu khi chưa có đồng thuận.'}
        </p>
      )}
    </div>
  );
}
