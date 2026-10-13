import { Link } from '@tanstack/react-router';
import type { DocumentEntry } from '@angia/contracts';
import {
  entryAction,
  entryDateLabel,
  entryStatusLabel,
  entryTitle,
} from '../../application/entryPresentation';
import { DocumentIcon, type DocumentIconName } from '../components/DocumentIcon';
import { EntryRecordSummary } from './EntryRecordSummary';

const ICONS: Record<NonNullable<DocumentEntry['type']>, DocumentIconName> = {
  prescription: 'prescription',
  lab_result: 'lab',
  device_reading: 'monitor',
};
const actionClass =
  'min-h-11 content-center rounded-xl bg-[#eaf6f5] px-4 text-sm font-semibold text-[#004135] hover:bg-[#deebea]';

// Thẻ chứng từ (Stitch 10424d70): tiêu đề, nhãn trạng thái trung tính, nơi khám · ngày, tóm tắt bản ghi.
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
    <article className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#004135] text-white">
          <DocumentIcon name={entry.type ? ICONS[entry.type] : 'file'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#131d1d]">{entryTitle(entry)}</h3>
            <span className="rounded-full bg-[#e4f0f0] px-2.5 py-0.5 text-xs font-medium text-[#404945]">
              {entryStatusLabel(entry)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#55615f]">
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
              {action === 'image' ? 'Xem ảnh' : 'Xem chi tiết'}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
