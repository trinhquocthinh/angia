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
export function ProfileConsentStatus({ profile }: Props) {
  const confirmed = profile.consentStatus === 'confirmed';
  return (
    <div className="mt-6 flex-1 rounded-xl bg-[#eaf6f5] p-4">
      <p className="text-sm font-medium text-[#004135]">{labels[profile.consentStatus]}</p>
      {confirmed ? (
        <div className="mt-2 break-words text-sm leading-6 text-[#55615f]">
          <p>
            Người đồng ý: {profile.consentRespondentName ?? 'Không còn thông tin'}
            {profile.consentSource !== 'self' && ' (thông tin tự nhập, chưa được xác minh).'}{' '}
          </p>
          {profile.consentSource === 'main_attested' && (
            <p>
              Người cam kết:{' '}
              {profile.consentConfirmedByName ?? 'Không còn thông tin tài khoản trong gia đình'}
            </p>
          )}
          {profile.consentConfirmedAt && (
            <p>Ngày xác nhận: {formatWithdrawnAt(profile.consentConfirmedAt)}</p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[#55615f]">
          {profile.consentAction === 'attestation'
            ? 'Xác nhận khi đã hỏi ý kiến và được người thân hoặc người giám hộ hợp pháp đồng ý.'
            : profile.consentAction === 'self'
              ? 'Bạn có thể xác nhận đồng ý cho hồ sơ của chính mình.'
              : profile.consentAction === 'invitation'
                ? 'Gửi liên kết để chính người thân xác nhận đồng ý.'
                : 'Hồ sơ chưa thể ghi dữ liệu sức khỏe khi chưa có đồng thuận.'}
          {profile.consentSource === 'legacy_attestation' && ' Xác nhận cũ cần được xác nhận lại.'}
        </p>
      )}
    </div>
  );
}
