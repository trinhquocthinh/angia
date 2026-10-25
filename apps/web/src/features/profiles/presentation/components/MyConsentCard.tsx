import type { MyConsentProfile } from '../../application/myConsentPorts';
import { formatWithdrawnAt } from '../../application/formatWithdrawnAt';
// Câu trung tính (người liên kết đọc, không phải người chăm sóc chính); confirmed/withdrawn có nhánh riêng.
const statusText: Record<Exclude<MyConsentProfile['consentStatus'], 'withdrawn' | 'confirmed'>, string> = {
  pending: 'Chưa có đồng thuận lưu thông tin sức khỏe cho hồ sơ này.',
  invited: 'Đang chờ phản hồi lời mời đồng thuận.',
  declined: 'Lời mời đồng thuận đã bị từ chối.',
};
// SPEC-036: thẻ đồng thuận của tài khoản liên kết; chỉ trạng thái đã đồng thuận mới có nút rút.
export function MyConsentCard({
  profile,
  onWithdraw,
}: {
  profile: MyConsentProfile | null;
  onWithdraw: () => void;
}) {
  if (!profile) return null;
  const { consentStatus, withdrawnAt } = profile;
  return (
    <section className="mb-8 rounded-[20px] bg-white p-6 shadow-sm" aria-labelledby="my-consent-title">
      <h2 id="my-consent-title" className="text-lg font-semibold text-[#004135]">
        Đồng thuận lưu thông tin sức khỏe
      </h2>
      <p className="mt-2 break-words text-sm font-medium">{profile.displayName}</p>
      <p className="mt-1 text-sm leading-6 text-[#55615f]">
        {consentStatus === 'withdrawn'
          ? `Bạn đã rút đồng thuận lúc ${withdrawnAt ? formatWithdrawnAt(withdrawnAt) : ''}.`
          : consentStatus === 'confirmed'
            ? 'Đã đồng ý chia sẻ'
            : statusText[consentStatus]}
      </p>
      {consentStatus === 'confirmed' && (
        <button
          type="button"
          className="mt-4 inline-flex min-h-[52px] items-center justify-center rounded-xl border border-[#c1c8c5] px-5 py-3 text-sm font-semibold text-[#004135] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          onClick={onWithdraw}
        >
          Rút đồng thuận
        </button>
      )}
    </section>
  );
}
