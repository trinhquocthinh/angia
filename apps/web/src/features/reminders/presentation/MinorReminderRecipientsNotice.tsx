import { Link } from '@tanstack/react-router';

// Hồ sơ trẻ chưa liên kết: người nhận nhắc chính là các người giám hộ (SPEC-070, API PUT trả 422).
export function MinorReminderRecipientsNotice({ profileId }: { profileId: string }) {
  return (
    <section
      aria-label="Người nhận nhắc"
      className="flex flex-col gap-3 rounded-[20px] bg-surface p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-accent">Người nhận nhắc</h2>
      <p className="text-sm text-text-secondary">
        Người nhận nhắc của hồ sơ trẻ là các người giám hộ.{' '}
        <Link
          to="/profiles/$profileId/guardians"
          params={{ profileId }}
          className="font-semibold text-accent underline underline-offset-4"
        >
          Xem người giám hộ
        </Link>
      </p>
    </section>
  );
}
