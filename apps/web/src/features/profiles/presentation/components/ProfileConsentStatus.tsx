import type { HealthProfile } from '../../application/ports';
const labels = {
  pending: 'Chưa có xác nhận của người thân',
  invited: 'Đang chờ người thân xác nhận',
  declined: 'Lời mời đã bị từ chối',
  confirmed: 'Đã đồng ý chia sẻ',
};
export function ProfileConsentStatus({ profile }: { profile: HealthProfile }) {
  const confirmed = profile.consentStatus === 'confirmed' && profile.consentSource === 'invitation';
  return (
    <div className="mt-6 flex-1 rounded-xl bg-[#eaf6f5] p-4">
      <p className="text-sm font-medium text-[#004135]">
        {confirmed
          ? labels.confirmed
          : profile.consentStatus === 'confirmed'
            ? labels.pending
            : labels[profile.consentStatus]}
      </p>
      {confirmed ? (
        <p className="mt-2 break-words text-sm leading-6 text-[#55615f]">
          Người xác nhận: {profile.consentRespondentName} (thông tin tự nhập, chưa được xác minh).
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[#55615f]">
          {profile.consentSource === 'legacy_attestation'
            ? 'Xác nhận cũ cần được thay bằng liên kết gửi người thân xác nhận lại.'
            : 'Gửi liên kết để người thân (hoặc người đại diện) xác nhận đồng ý.'}
        </p>
      )}
    </div>
  );
}
