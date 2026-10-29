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
const term = 'font-medium text-[#131d1d]';
export function ProfileConsentStatus({ profile }: Props) {
  const confirmed = profile.consentStatus === 'confirmed';
  return (
    <div className="mt-3.5 flex flex-1 flex-col gap-2 rounded-xl border border-[#bfc9c4]/20 bg-[#eaf6f5] p-3 lg:mt-5 lg:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#286958]">
          <AdminIcon name={confirmed ? 'verified_user' : 'info'} size={18} />
          {labels[profile.consentStatus]}
        </p>
        {confirmed && profile.consentBasis === 'guardian' && (
          <span className="hidden text-[11px] font-medium tracking-[0.03em] text-[#707975] lg:inline">
            Ủy quyền giám hộ
          </span>
        )}
      </div>
      {confirmed ? (
        <div className="flex flex-col gap-0.5 break-words text-[13px] leading-5 text-[#404945]">
          <p>
            <span className={term}>Người đồng ý:</span>{' '}
            {profile.consentRespondentName ?? 'Không còn thông tin'}
            {profile.consentSource !== 'self' && (
              <span className="text-xs text-[#707975]"> (thông tin tự nhập, chưa được xác minh)</span>
            )}
          </p>
          {profile.consentSource === 'main_attested' && (
            <p>
              <span className={term}>Người cam kết:</span>{' '}
              {profile.consentConfirmedByName ?? 'Không còn thông tin tài khoản trong gia đình'}
            </p>
          )}
          {profile.consentConfirmedAt && (
            <p>
              <span className={term}>Ngày xác nhận:</span> {formatWithdrawnAt(profile.consentConfirmedAt)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[13px] leading-5 text-[#404945]">
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
