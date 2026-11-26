import { Link } from '@tanstack/react-router';
import type { DocumentEntry } from '@angia/contracts';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import {
  entryAction,
  entryDateLabel,
  entryStatusLabel,
  entryTitle,
} from '../../application/entryPresentation';
import { EntryRecordSummary } from './EntryRecordSummary';

const CLAY_ICONS: Record<NonNullable<DocumentEntry['type']>, ProfileSectionIconName> = {
  prescription: 'receipt_long',
  lab_result: 'science',
  device_reading: 'monitor_heart',
};
const actionClass =
  'inline-flex min-h-btn items-center justify-center rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

// Thẻ chứng từ theo Stitch 3D Bento v2.0: icon 3D đất sét, tiêu đề serif, nhãn trạng thái trung tính, tóm tắt bản ghi.
export function DocumentEntryCard({
  entry,
  onOpen,
}: {
  entry: DocumentEntry;
  onOpen: (entry: DocumentEntry) => void;
}) {
  const action = entryAction(entry);
  const facility = entry.records.prescription?.facility ?? entry.records.labResults[0]?.facility ?? null;
  return (
    <article className="doc-bento-card flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3.5">
        <span className="doc-clay-tile" aria-hidden="true">
          <ProfileSectionIcon name={entry.type ? CLAY_ICONS[entry.type] : 'folder_open'} size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="auth-heading text-body font-bold text-text-primary">{entryTitle(entry)}</h3>
            <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-semibold text-on-secondary-container">
              {entryStatusLabel(entry)}
            </span>
          </div>
          <p className="mt-1 text-caption text-text-secondary">
            {facility ? `${facility} · ` : ''}
            {entryDateLabel(entry)}
          </p>
        </div>
      </div>
      <EntryRecordSummary records={entry.records} />
      {action !== 'none' && (
        <div className="flex flex-wrap gap-2">
          {action === 'review' ? (
            <Link to="/review/$documentId" params={{ documentId: entry.id }} className={actionClass}>
              Mở để duyệt
            </Link>
          ) : (
            <button type="button" onClick={() => onOpen(entry)} className={actionClass}>
              Xem chi tiết
            </button>
          )}
        </div>
      )}
    </article>
  );
}
