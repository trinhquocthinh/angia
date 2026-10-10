import type { DocumentType } from '../../application/ports';
import { ChoiceChip } from './ChoiceChip';
import { DocumentIcon } from './DocumentIcon';
import { DOCUMENT_TYPES } from './DocumentTypePicker';
import { PickerCard } from './PickerCard';

// Nhập tay (SPEC-011): người nhập bắt buộc chọn loại dữ liệu; khác bộ chọn lúc tải ảnh, không bỏ chọn được.
export function RecordTypePicker({
  value,
  onChange,
}: {
  value: DocumentType | null;
  onChange: (value: DocumentType) => void;
}) {
  return (
    <PickerCard icon="category" title="Loại dữ liệu" hint="Bắt buộc">
      {DOCUMENT_TYPES.map((type) => (
        <ChoiceChip key={type.value} selected={value === type.value} onClick={() => onChange(type.value)}>
          <DocumentIcon name={type.icon} size={16} />
          {type.label}
        </ChoiceChip>
      ))}
    </PickerCard>
  );
}
