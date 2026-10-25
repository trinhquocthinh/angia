import { GuideCard, type GuideStep } from './GuideCard';

const STEPS: GuideStep[] = [
  {
    icon: 'menu',
    title: (
      <>
        Nhấn nút <strong>···</strong> ở góc trên bên phải
      </>
    ),
    detail: 'Trong Zalo, Facebook hoặc Messenger, nút này nằm cạnh nút đóng trang.',
  },
  {
    icon: 'external',
    title: (
      <>
        Chọn <strong>Mở bằng trình duyệt</strong>
      </>
    ),
    detail: 'iPhone mở bằng Safari, Android mở bằng Chrome. Tên mục có thể là “Mở trong Safari/Chrome”.',
  },
  {
    icon: 'bell',
    title: <>Đăng nhập lại và vào Thông báo</>,
    detail: 'Làm tiếp các bước cài đặt và bật thông báo hiện ra trên trang.',
  },
];

// Trình duyệt nhúng của ứng dụng chat không cài được PWA và không nhận Web Push.
export function OpenInBrowserGuide() {
  return (
    <GuideCard
      id="open-in-browser-title"
      title="Mở AN GIA bằng Safari hoặc Chrome"
      intro="Trang đang mở bên trong Zalo hoặc Facebook nên chưa bật được thông báo. Làm 3 bước sau:"
      steps={STEPS}
    />
  );
}
