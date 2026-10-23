import type { ReactNode } from 'react';
import { revealStyle } from '@src/shared/ui/revealStyle';
import '@src/shared/ui/modal-motion.css';
import { PushIcon, type PushIconName } from './PushIcon';

const STEPS: { icon: PushIconName; title: ReactNode; detail: string }[] = [
  {
    icon: 'share',
    title: (
      <>
        Nhấn nút <strong>Chia sẻ</strong> trong Safari
      </>
    ),
    detail:
      'Biểu tượng ô vuông có mũi tên lên ở thanh dưới cùng (iPad: góc trên). Nếu không thấy, nhấn ··· trước.',
  },
  {
    icon: 'addSquare',
    title: (
      <>
        Chọn <strong>Thêm vào Màn hình chính</strong>
      </>
    ),
    detail: 'Kéo danh sách thao tác xuống để tìm mục này.',
  },
  {
    icon: 'check',
    title: (
      <>
        Nhấn <strong>Thêm</strong>
      </>
    ),
    detail: 'Nếu có tùy chọn mở như ứng dụng web, giữ tùy chọn này bật.',
  },
  {
    icon: 'bell',
    title: <>Mở biểu tượng AN GIA trên Màn hình chính</>,
    detail: 'Vào Thông báo và bật lại tại đây. Trong tab Safari, iPhone không cho trang web gửi thông báo.',
  },
];

// iOS không có lời mời cài tự động như Android (không có `beforeinstallprompt`), nên chỉ có thể
// hướng dẫn từng bước. Web Push trên iPhone cần iOS 16.4 trở lên và mở từ Màn hình chính.
export function IosInstallGuide() {
  return (
    <section aria-labelledby="ios-install-title" className="rounded-[20px] bg-[#eaf6f5] p-4 lg:p-6">
      <h2 id="ios-install-title" className="text-base font-semibold text-[#004135]">
        Cài AN GIA lên iPhone để nhận thông báo
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[#404945]">
        Làm 4 bước sau trong Safari (cần iOS 16.4 trở lên):
      </p>
      <ol className="mt-4 flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li
            key={step.icon}
            className="angia-modal-reveal flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_#0041350a]"
            style={revealStyle(index)}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e3efea] text-[#20594b]">
              <PushIcon name={step.icon} />
              <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#004135] text-[11px] font-bold text-white">
                {index + 1}
              </span>
            </span>
            <span className="min-w-0 text-sm leading-relaxed">
              <span className="block text-[#131d1d]">{step.title}</span>
              <span className="block text-[13px] text-[#55615f]">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
