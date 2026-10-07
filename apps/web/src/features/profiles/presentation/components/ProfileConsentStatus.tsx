import type { HealthProfile } from '../../application/ports';
const labels = {
  pending: 'Chưa có đồng thuận',
  invited: 'Đang chờ phản hồi lời mời',
  declined: 'Lời mời đã bị từ chối',
  confirmed: 'Đã đồng thuận',
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
          Tên tự khai: {profile.consentRespondentName}. Danh tính và tư cách chưa được xác minh.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[#55615f]">
          {profile.consentSource === 'legacy_attestation'
            ? 'Xác nhận cũ cần được thay bằng phản hồi qua link đồng thuận.'
            : 'Gửi link để đối tượng hoặc người giám hộ hợp pháp tự phản hồi.'}
        </p>
      )}
    </div>
  );
}
