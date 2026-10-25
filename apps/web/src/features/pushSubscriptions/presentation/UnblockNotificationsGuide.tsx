import { GuideCard, type GuideStep } from './GuideCard';

const IOS_STEPS: GuideStep[] = [
  {
    icon: 'settings',
    title: (
      <>
        Mở ứng dụng <strong>Cài đặt</strong> của iPhone
      </>
    ),
    detail: 'Biểu tượng bánh răng màu xám.',
  },
  {
    icon: 'bell',
    title: (
      <>
        Chọn <strong>Thông báo</strong> → <strong>AN GIA</strong>
      </>
    ),
    detail: 'Kéo xuống danh sách ứng dụng để tìm AN GIA.',
  },
  {
    icon: 'check',
    title: (
      <>
        Bật <strong>Cho phép thông báo</strong>
      </>
    ),
    detail: 'Quay lại AN GIA và nhấn Bật thông báo.',
  },
];

const ANDROID_STEPS: GuideStep[] = [
  {
    icon: 'settings',
    title: (
      <>
        Nhấn giữ biểu tượng AN GIA → <strong>Thông tin ứng dụng</strong>
      </>
    ),
    detail: 'Nếu đang mở trong tab Chrome: nhấn biểu tượng bên trái thanh địa chỉ → Quyền.',
  },
  {
    icon: 'bell',
    title: (
      <>
        Chọn <strong>Thông báo</strong> và bật lên
      </>
    ),
    detail: 'Một số máy ghi là “Cho phép thông báo”.',
  },
  {
    icon: 'check',
    title: <>Quay lại AN GIA và nhấn Bật thông báo</>,
    detail: 'Sau đó nhấn Gửi thông báo thử để kiểm tra.',
  },
];

// Khi quyền đã bị chặn, trình duyệt không hỏi lại nữa; chỉ mở lại được trong cài đặt máy.
export function UnblockNotificationsGuide({ os }: { os: 'ios' | 'android' }) {
  return (
    <GuideCard
      id="unblock-notifications-title"
      title="Thông báo đang bị chặn trên máy này"
      intro="Máy sẽ không hỏi lại nữa. Mở lại quyền theo 3 bước sau:"
      steps={os === 'ios' ? IOS_STEPS : ANDROID_STEPS}
    />
  );
}
