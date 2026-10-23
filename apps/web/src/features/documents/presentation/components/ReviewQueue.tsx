import { groupQueueByDay } from '../../application/reviewQueue';
import type { SourceDocument } from '../../application/reviewPorts';
import { DocumentIcon } from './DocumentIcon';
import { MoreButton } from './MoreButton';
import { ReviewQueueItem } from './ReviewQueueItem';

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

// Design §6 `/review`: khung xương khi tải, thẻ lỗi + Thử lại, trạng thái rỗng thân mật.
export function ReviewQueue(props: ReviewQueueProps) {
  const { documents, loading, error, more } = props;
  return (
    <section
      aria-labelledby="review-queue-title"
      className="flex flex-col overflow-hidden rounded-[20px] bg-white"
    >
      <div className="flex flex-col gap-1 bg-[#eaf6f5]/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <h1
            id="review-queue-title"
            className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold text-[#004135]"
          >
            <span className="text-[#286958]">
              <DocumentIcon name="file" size={20} />
            </span>
            Chờ xác nhận
          </h1>
          {!loading && !error && (
            <span className="whitespace-nowrap rounded-full bg-[#aef0da] px-2 py-0.5 text-xs font-bold text-[#2f6f5e]">
              {documents.length}
              {more ? '+' : ''} giấy tờ
            </span>
          )}
        </div>
        <p className="text-sm text-[#404945]">Kiểm tra thông tin đọc từ ảnh chụp trước khi lưu vào sổ.</p>
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
      <div role="status" aria-label="Đang tải hàng đợi" className="flex flex-col gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-[#eaf6f5] motion-reduce:animate-none" />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-[#fdecea] p-4 text-sm">
        <p>Không tải được danh sách chờ kiểm tra.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  if (documents.length === 0)
    return (
      <p className="rounded-xl bg-[#eaf6f5] p-6 text-center text-sm text-[#55615f]">
        Không còn giấy tờ nào chờ kiểm tra.
      </p>
    );
  return (
    <div className="flex flex-col gap-4 py-1">
      {groupQueueByDay(documents, new Date()).map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 px-2 text-xs text-[#707975]">
            <h2 className="font-semibold uppercase tracking-wider">{group.label}</h2>
            <span className="whitespace-nowrap font-medium">{group.documents.length} tài liệu</span>
          </div>
          <ul className="flex flex-col gap-1">
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
