import type { DocumentEntry } from '@angia/contracts';
import { SidePanel } from '@src/shared/ui/SidePanel';
import { entryDateLabel, entryStatusLabel, entryTitle } from '../../application/entryPresentation';
import { EntryImage } from './EntryImage';
import { EntryRecordSummary } from './EntryRecordSummary';

type Props = { entry: DocumentEntry; canReuse: boolean; onReuse: () => void; onClose: () => void };

// Ngăn chi tiết chỉ đọc: bản ghi đầy đủ + ảnh; nút "Dùng lại đơn này" với đơn đã lưu (SPEC-029).
export function DocumentEntryPanel({ entry, canReuse, onReuse, onClose }: Props) {
  const prescription = entry.records.prescription;
  return (
    <SidePanel
      titleId="document-entry-title"
      title={entryTitle(entry)}
      subtitle={`${entryStatusLabel(entry)} · ${entryDateLabel(entry)}`}
      closeLabel="Đóng chi tiết giấy tờ"
      pending={false}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 py-5">
        {prescription?.diagnosis && (
          <p className="text-sm">
            <span className="font-semibold">Chẩn đoán ghi trên đơn: </span>
            {prescription.diagnosis}
          </p>
        )}
        <EntryRecordSummary records={entry.records} />
        {prescription && canReuse && (
          <button
            type="button"
            onClick={onReuse}
            className="min-h-11 rounded-xl bg-[#004135] px-4 text-sm font-semibold text-white hover:bg-[#20594b]"
          >
            Dùng lại đơn này
          </button>
        )}
        {entry.origin === 'document' && <EntryImage documentId={entry.id} hasOcrImage={entry.hasOcrImage} />}
      </div>
    </SidePanel>
  );
}
