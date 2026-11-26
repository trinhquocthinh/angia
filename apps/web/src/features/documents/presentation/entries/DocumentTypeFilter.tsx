import type { EntryTypeFilter } from '../../application/documentEntryPorts';

const FILTERS: readonly { value: EntryTypeFilter | undefined; label: string }[] = [
  { value: undefined, label: 'Tất cả' },
  { value: 'prescription', label: 'Đơn thuốc' },
  { value: 'lab_result', label: 'Phiếu xét nghiệm' },
  { value: 'device_reading', label: 'Ảnh máy đo' },
];

// Chip lọc loại theo Stitch 3D Bento v2.0; bỏ lọc năm và ô tìm kiếm (owner chốt 2026-10-13).
export function DocumentTypeFilter({
  value,
  onChange,
}: {
  value: EntryTypeFilter | undefined;
  onChange: (value: EntryTypeFilter | undefined) => void;
}) {
  return (
    <div role="group" aria-label="Lọc theo loại giấy tờ" className="doc-bento-card flex flex-wrap gap-2 p-4">
      {FILTERS.map((filter) => (
        <button
          key={filter.label}
          type="button"
          aria-pressed={filter.value === value}
          onClick={() => onChange(filter.value)}
          className="min-h-11 rounded-full bg-accent-soft px-4 text-caption font-semibold text-text-secondary transition-colors hover:bg-choice-soft hover:text-accent aria-pressed:bg-accent aria-pressed:text-on-accent aria-pressed:shadow-stitch-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
