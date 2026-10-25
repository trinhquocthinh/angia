import { GuideCard, type GuideStep } from './GuideCard';

const STEPS: GuideStep[] = [
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
    <GuideCard
      id="ios-install-title"
      title="Cài AN GIA lên iPhone để nhận thông báo"
      intro="Làm 4 bước sau trong Safari (cần iOS 16.4 trở lên):"
      steps={STEPS}
    />
  );
}
