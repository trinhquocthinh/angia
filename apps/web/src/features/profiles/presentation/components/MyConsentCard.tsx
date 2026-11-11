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
  onUnlink,
}: {
  profile: MyConsentProfile | null;
  onWithdraw: () => void;
  onUnlink: () => void;
}) {
  if (!profile) return null;
  const { consentStatus, withdrawnAt } = profile;
  return (
    <section className="mb-8 rounded-[20px] bg-surface p-6 shadow-sm" aria-labelledby="my-consent-title">
      <h2 id="my-consent-title" className="text-lg font-semibold text-accent">
        Đồng thuận lưu thông tin sức khỏe
      </h2>
      <p className="mt-2 break-words text-sm font-medium">{profile.displayName}</p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">
        {consentStatus === 'withdrawn'
          ? `Bạn đã rút đồng thuận lúc ${withdrawnAt ? formatWithdrawnAt(withdrawnAt) : ''}.`
          : consentStatus === 'confirmed'
            ? 'Đã đồng ý chia sẻ'
            : statusText[consentStatus]}
      </p>
      {consentStatus === 'confirmed' && (
        <button
          type="button"
          className="mt-4 inline-flex min-h-[52px] items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
          onClick={onWithdraw}
        >
          Rút đồng thuận
        </button>
      )}
      <button
        type="button"
        className="mt-4 ml-3 inline-flex min-h-[52px] items-center justify-center rounded-xl px-3 py-3 text-sm font-semibold text-text-secondary cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
        onClick={onUnlink}
      >
        Gỡ liên kết
      </button>
    </section>
  );
}
