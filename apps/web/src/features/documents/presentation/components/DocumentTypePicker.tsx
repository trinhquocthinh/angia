import type { DocumentType } from '../../application/ports';
import { ChoiceChip } from './ChoiceChip';
import { DocumentIcon, type DocumentIconName } from './DocumentIcon';
import { PickerCard } from './PickerCard';

export const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: DocumentIconName }[] = [
  { value: 'prescription', label: 'Đơn thuốc', icon: 'prescription' },
  { value: 'lab_result', label: 'Xét nghiệm', icon: 'lab' },
  { value: 'device_reading', label: 'Máy đo cá nhân', icon: 'monitor' },
];

// Loại chỉ là gợi ý (declaredType tùy chọn); bấm lại để bỏ chọn.
export function DocumentTypePicker({
  value,
  onChange,
}: {
  value: DocumentType | null;
  onChange: (value: DocumentType | null) => void;
}) {
  return (
    <PickerCard icon="category" title="Loại giấy tờ" hint="Tùy chọn gợi ý">
      {DOCUMENT_TYPES.map((type) => (
        <ChoiceChip
          key={type.value}
          selected={value === type.value}
          onClick={() => onChange(value === type.value ? null : type.value)}
        >
          <DocumentIcon name={type.icon} size={16} />
          {type.label}
        </ChoiceChip>
      ))}
    </PickerCard>
  );
}
