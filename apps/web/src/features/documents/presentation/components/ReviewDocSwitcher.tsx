import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { SourceDocument } from '../../application/reviewPorts';

type Props = {
  documents: SourceDocument[];
  documentId: string;
};

// Bộ chuyển nhanh giấy tờ trước/sau ở đầu trang chi tiết theo Stitch bb3e9ab1.
export function ReviewDocSwitcher({ documents, documentId }: Props) {
  const index = documents.findIndex((item) => item.id === documentId);
  if (index === -1 || documents.length === 0) return null;
  const prev = index > 0 ? documents[index - 1] : null;
  const next = index < documents.length - 1 ? documents[index + 1] : null;
  return (
    <nav aria-label="Chuyển giấy tờ trong hàng chờ" className="doc-switcher">
      {prev ? (
        <Link
          to="/review/$documentId"
          params={{ documentId: prev.id }}
          aria-label="Giấy tờ trước"
          className="doc-switcher-btn doc-switcher-prev"
        >
          <AdminIcon name="arrow_back" size={18} />
          <span className="hidden sm:inline">Giấy trước</span>
        </Link>
      ) : (
        <span aria-disabled="true" className="doc-switcher-btn doc-switcher-prev doc-switcher-disabled">
          <AdminIcon name="arrow_back" size={18} />
          <span className="hidden sm:inline">Giấy trước</span>
        </span>
      )}
      <span className="flex items-baseline gap-1 px-2 text-center tabular-nums select-none">
        <span className="text-heading-2 font-bold text-accent">{index + 1}</span>
        <span className="text-caption text-text-secondary">/</span>
        <span className="text-body font-semibold text-text-secondary">{documents.length}</span>
      </span>
      {next ? (
        <Link
          to="/review/$documentId"
          params={{ documentId: next.id }}
          aria-label="Giấy tờ kế tiếp"
          className="doc-switcher-btn doc-switcher-next"
        >
          <span className="hidden sm:inline">Giấy sau</span>
          <AdminIcon name="arrow_forward" size={18} />
        </Link>
      ) : (
        <span aria-disabled="true" className="doc-switcher-btn doc-switcher-next doc-switcher-disabled">
          <span className="hidden sm:inline">Giấy sau</span>
          <AdminIcon name="arrow_forward" size={18} />
        </span>
      )}
    </nav>
  );
}
