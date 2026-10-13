import type { EntryTypeFilter } from '../../application/documentEntryPorts';

const FILTERS: readonly { value: EntryTypeFilter | undefined; label: string }[] = [
  { value: undefined, label: 'Tất cả' },
  { value: 'prescription', label: 'Đơn thuốc' },
  { value: 'lab_result', label: 'Phiếu xét nghiệm' },
  { value: 'device_reading', label: 'Ảnh máy đo' },
];

// Chip lọc loại theo Stitch 10424d70; bỏ lọc năm và ô tìm kiếm (owner chốt 2026-10-13).
export function DocumentTypeFilter({
  value,
  onChange,
}: {
  value: EntryTypeFilter | undefined;
  onChange: (value: EntryTypeFilter | undefined) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc theo loại giấy tờ"
      className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm"
    >
      {FILTERS.map((filter) => (
        <button
          key={filter.label}
          type="button"
          aria-pressed={filter.value === value}
          onClick={() => onChange(filter.value)}
          className="min-h-11 rounded-full bg-[#eaf6f5] px-4 text-sm font-medium text-[#404945] hover:bg-[#deebea] aria-pressed:bg-[#aef0da] aria-pressed:font-semibold aria-pressed:text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
