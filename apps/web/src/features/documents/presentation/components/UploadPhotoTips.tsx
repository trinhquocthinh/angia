import { revealStyle } from '@src/shared/ui/revealStyle';
import { DocumentIcon } from './DocumentIcon';

const TIPS = [
  'Đủ sáng, không bị lóa hay đổ bóng',
  'Giữ máy thẳng, chữ rõ nét',
  'Chụp trọn phần thuốc, chỉ số và ngày',
];

// Chỉ hiện khi chưa chọn ảnh nào: gợi ý cách chụp, không nói gì về nội dung y tế trên giấy (BR-033).
export function UploadPhotoTips() {
  return (
    <section
      aria-labelledby="upload-tips-title"
      className="angia-modal-reveal flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:gap-5"
      style={revealStyle(5)}
    >
      <h2 id="upload-tips-title" className="shrink-0 text-[13px] leading-5 font-semibold text-[#20594b]">
        Để ảnh dễ đọc
      </h2>
      <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
        {TIPS.map((tip) => (
          <li key={tip} className="flex items-center gap-1.5 text-[13px] leading-5 text-[#404945]">
            <span className="text-[#286958]">
              <DocumentIcon name="check" size={14} />
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
