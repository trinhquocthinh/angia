import type { DocumentType } from '../../application/ports';
import { ChoiceChip } from './ChoiceChip';
import { DocumentIcon, type DocumentIconName } from './DocumentIcon';
import { PickerCard } from './PickerCard';

export const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: DocumentIconName }[] = [
  { value: 'prescription', label: 'Đơn thuốc', icon: 'prescription' },
  { value: 'lab_result', label: 'Xét nghiệm', icon: 'microscope' },
  { value: 'device_reading', label: 'Máy đo cá nhân', icon: 'monitor' },
];

// Loại chỉ là gợi ý (declaredType tùy chọn). Mặc định "Tự động nhận diện" từng ảnh — phù hợp lô trộn nhiều loại;
// chọn một loại thì ảnh AI đọc ra loại khác chuyển sang nhập tay (BR-016). Bấm lại chip loại để bỏ chọn.
export function DocumentTypePicker({
  value,
  onChange,
  allowDeviceReading = true,
}: {
  allowDeviceReading?: boolean;
  value: DocumentType | null;
  onChange: (value: DocumentType | null) => void;
}) {
  return (
    <PickerCard icon="category" title="Loại giấy tờ" hint="Tùy chọn gợi ý">
      <ChoiceChip selected={value === null} onClick={() => onChange(null)}>
        Tự động nhận diện
      </ChoiceChip>
      {DOCUMENT_TYPES.filter((type) => type.value !== 'device_reading' || allowDeviceReading).map((type) => (
        <ChoiceChip
          key={type.value}
          selected={value === type.value}
          onClick={() => onChange(value === type.value ? null : type.value)}
        >
          <span className={value === type.value ? 'text-[#b3eddf]' : 'text-[#707975]'}>
            <DocumentIcon name={type.icon} size={16} />
          </span>
          {type.label}
        </ChoiceChip>
      ))}
      <p className="basis-full text-xs leading-5 text-[#55615f]">
        Chọn nhiều loại giấy tờ trong một lần tải: để hệ thống tự động nhận diện từng ảnh. Chỉ chọn một loại
        khi mọi ảnh cùng loại — ảnh khác loại sẽ chuyển sang nhập tay.
      </p>
    </PickerCard>
  );
}
