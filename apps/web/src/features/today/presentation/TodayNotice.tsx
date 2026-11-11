import { Link } from '@tanstack/react-router';
import { Card } from '@src/shared/ui/card/Card';

const linkClass =
  'inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border px-4 py-2 text-lg leading-6 font-semibold text-accent focus-visible:outline-3 focus-visible:outline-focus';

type Props = { kind: 'withdrawn' | 'consent' | 'empty'; main: boolean; profileId?: string };

export function TodayNotice({ kind, main, profileId }: Props) {
  return (
    <Card>
      <div className="flex flex-col items-start gap-4">
        <p>
          {kind === 'empty'
            ? 'Hôm nay không có liều nào.'
            : kind === 'withdrawn'
              ? 'Hồ sơ đã rút đồng thuận. Cần lời mời đồng thuận để đồng ý lại.'
              : 'Hồ sơ chưa được đồng ý lưu dữ liệu.'}
        </p>
        {kind === 'empty' ? (
          main && profileId ? (
            <Link className={linkClass} to="/profiles/$profileId/medications" params={{ profileId }}>
              Xem thuốc đang dùng
            </Link>
          ) : (
            <Link className={linkClass} to="/my-profile" search={{ section: 'today' }}>
              Xem thuốc đang dùng
            </Link>
          )
        ) : main ? (
          <Link className={linkClass} to="/" search={{ view: 'profiles' }}>
            Hồ sơ gia đình
          </Link>
        ) : (
          <>
            <p className="text-base leading-6 text-text-secondary">
              Nhờ người chăm sóc chính gửi lời mời đồng thuận mới.
            </p>
            <Link className={linkClass} to="/" search={{ view: 'profiles' }}>
              Quản lý liên kết hồ sơ
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
