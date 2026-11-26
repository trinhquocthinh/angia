import type { components } from '@src/shared/api/schema.gen';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { ReviewRepository } from '../../application/reviewPorts';
import type { useReviewQueue } from '../../application/useReviewWorkspace';
import { DocumentUploadLink } from './DocumentUploadLink';
import { ReviewDetail } from './ReviewDetail';
import { ReviewDocSwitcher } from './ReviewDocSwitcher';
import { ReviewQueue } from './ReviewQueue';

type Props = {
  repository: ReviewRepository;
  session: components['schemas']['MeContextResponse'];
  profiles: HealthProfile[];
  documentId: string | null;
  queue: ReturnType<typeof useReviewQueue>;
};

// Danh sách và chi tiết dùng chung truy vấn phân trang, không tải toàn bộ hàng chờ.
export function ReviewWorkspace({ repository, session, profiles, documentId, queue }: Props) {
  const documents = queue.data?.pages.flatMap((page) => page.items) ?? [];
  const names = new Map(profiles.map((profile) => [profile.id, profile.displayName]));
  const queuePanel = (
    <ReviewQueue
      documents={documents}
      profileNames={names}
      activeId={documentId}
      loading={queue.isPending}
      error={queue.isError}
      retry={() => void queue.refetch()}
      more={
        queue.hasNextPage
          ? { loading: queue.isFetchingNextPage, load: () => void queue.fetchNextPage() }
          : null
      }
    />
  );
  return (
    <div className={`review-page ${documentId ? 'review-page-detail' : ''}`}>
      <header className="review-page-heading">
        <div className="min-w-0 space-y-1.5">
          <p className="inline-flex items-center gap-2 text-caption font-semibold tracking-wider text-secondary uppercase">
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
            Sổ tay chăm sóc gia đình
          </p>
          <h1 className="auth-heading text-heading-1 font-semibold tracking-tight text-accent sm:text-display">
            {documentId ? 'Duyệt đơn thuốc & giấy tờ' : 'Giấy tờ chờ duyệt'}
          </h1>
          <p className="text-body text-text-secondary">
            Đối chiếu thông tin với ảnh đã che trước khi lưu vào sổ.
          </p>
        </div>
        {documentId ? (
          <ReviewDocSwitcher documents={documents} documentId={documentId} />
        ) : (
          <DocumentUploadLink />
        )}
      </header>
      {documentId ? (
        <ReviewDetail
          repository={repository}
          session={session}
          documentId={documentId}
          queue={documents}
          profileNames={names}
          queuePanel={queuePanel}
        />
      ) : (
        queuePanel
      )}
    </div>
  );
}
