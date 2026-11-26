import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { groupQueueByDay } from '../../application/reviewQueue';
import type { SourceDocument } from '../../application/reviewPorts';
import { MoreButton } from './MoreButton';
import { ReviewQueueItem } from './ReviewQueueItem';
import './review-motion.css';

type ReviewQueueProps = {
  documents: SourceDocument[];
  profileNames: Map<string, string>;
  activeId: string | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
  /** F09a: còn trang sau thì hiện "Xem thêm". */
  more?: { loading: boolean; load: () => void } | null;
};

// Design §6 `/review` & Stitch bb3e9ab1: khung xương khi tải, thẻ lỗi + Thử lại, trạng thái rỗng thân mật.
export function ReviewQueue(props: ReviewQueueProps) {
  const { documents, loading, error, more } = props;
  return (
    <section
      aria-labelledby="review-queue-title"
      className="review-queue flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card"
    >
      <div className="flex flex-col gap-1.5 bg-accent-soft/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="doc-clay-tile-sm" aria-hidden="true">
              <ProfileSectionIcon name="folder_open" size={26} />
            </span>
            <h2
              id="review-queue-title"
              className="auth-heading whitespace-nowrap text-heading-2 font-semibold text-accent"
            >
              Chờ xác nhận
            </h2>
          </div>
          {!loading && !error && (
            <span className="whitespace-nowrap rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-bold text-on-secondary-container tabular-nums">
              {documents.length}
              {more ? '+' : ''} giấy tờ
            </span>
          )}
        </div>
        <p className="text-caption text-text-secondary">
          Kiểm tra thông tin đọc từ ảnh chụp trước khi lưu vào sổ.
        </p>
      </div>
      <div className="flex flex-col gap-3 p-2">
        <QueueBody {...props} />
        {more && !loading && !error && <MoreButton {...more} />}
      </div>
    </section>
  );
}

function QueueBody({ documents, profileNames, activeId, loading, error, retry }: ReviewQueueProps) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải hàng đợi" className="flex flex-col gap-2.5 p-1">
        {[0, 1, 2].map((key) => (
          <div key={key} className="review-shimmer h-20 rounded-2xl bg-accent-soft" />
        ))}
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl bg-danger-soft p-4 text-caption text-danger"
      >
        <p className="font-medium">Không tải được danh sách chờ kiểm tra.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-surface px-4 font-semibold text-accent shadow-stitch-sm"
        >
          Thử lại
        </button>
      </div>
    );
  if (documents.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-accent-soft/75 p-7 text-center text-body text-text-secondary">
        <span className="doc-clay-emblem" aria-hidden="true">
          <ProfileSectionIcon name="folder_open" size={40} />
        </span>
        <p className="font-medium text-text-primary">Không còn giấy tờ nào chờ kiểm tra.</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 py-1">
      {groupQueueByDay(documents, new Date()).map((group) => (
        <div key={group.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 px-2 text-caption text-text-secondary">
            <h3 className="font-semibold tracking-wider uppercase">{group.label}</h3>
            <span className="whitespace-nowrap font-medium tabular-nums">
              {group.documents.length} tài liệu
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {group.documents.map((document) => (
              <li key={document.id}>
                <ReviewQueueItem
                  document={document}
                  profileName={profileNames.get(document.healthProfileId) ?? 'Hồ sơ'}
                  active={document.id === activeId}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
