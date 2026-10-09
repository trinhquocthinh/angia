import { groupQueueByDay } from '../../application/reviewQueue';
import type { SourceDocument } from '../../application/reviewPorts';
import { ReviewQueueItem } from './ReviewQueueItem';

type ReviewQueueProps = {
  documents: SourceDocument[];
  profileNames: Map<string, string>;
  activeId: string | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

// Design §6 `/review`: khung xương khi tải, thẻ lỗi + Thử lại, trạng thái rỗng thân mật.
export function ReviewQueue({ documents, profileNames, activeId, loading, error, retry }: ReviewQueueProps) {
  return (
    <section aria-labelledby="review-queue-title" className="flex flex-col gap-4 rounded-[20px] bg-white p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 id="review-queue-title" className="whitespace-nowrap text-lg font-semibold text-[#004135]">
            Chờ xác nhận
          </h1>
          {!loading && !error && (
            <span className="whitespace-nowrap rounded-full bg-[#b3eddf] px-2.5 py-0.5 text-xs font-semibold text-[#004135]">
              {documents.length} chứng từ
            </span>
          )}
        </div>
        <p className="text-sm text-[#55615f]">Kiểm tra thông tin đọc từ ảnh chụp trước khi lưu vào sổ.</p>
      </div>
      <QueueBody {...{ documents, profileNames, activeId, loading, error, retry }} />
    </section>
  );
}

function QueueBody({ documents, profileNames, activeId, loading, error, retry }: ReviewQueueProps) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải hàng đợi" className="flex flex-col gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-2xl bg-[#eaf6f5] motion-reduce:animate-none" />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-[#fdecea] p-4 text-sm">
        <p>Không tải được danh sách chờ duyệt.</p>
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
      <p className="rounded-2xl bg-[#eaf6f5] p-6 text-center text-sm text-[#55615f]">
        Không còn chứng từ chờ duyệt.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      {groupQueueByDay(documents, new Date()).map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-[#55615f]">
            {group.label}
          </h2>
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
