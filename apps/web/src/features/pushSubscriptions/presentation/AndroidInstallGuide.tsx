import { GuideCard, type GuideStep } from './GuideCard';
import { PushIcon } from './PushIcon';

const STEPS: GuideStep[] = [
  {
    icon: 'menu',
    title: (
      <>
        Nhấn nút <strong>⋮</strong> ở góc trên bên phải Chrome
      </>
    ),
    detail: 'Ba chấm dọc cạnh thanh địa chỉ.',
  },
  {
    icon: 'addSquare',
    title: (
      <>
        Chọn <strong>Thêm vào màn hình chính</strong> hoặc <strong>Cài đặt ứng dụng</strong>
      </>
    ),
    detail: 'Tên mục khác nhau tùy máy. Nhấn Cài đặt hoặc Thêm để xác nhận.',
  },
  {
    icon: 'bell',
    title: <>Mở biểu tượng AN GIA trên màn hình chính</>,
    detail: 'Từ lần sau chỉ cần nhấn biểu tượng này, không phải tìm lại đường link.',
  },
];

interface Props {
  canPrompt: boolean;
  onInstall(): void;
}

// Trên Android thông báo vẫn chạy trong Chrome; cài lên màn hình chính để dễ mở lại.
export function AndroidInstallGuide({ canPrompt, onInstall }: Props) {
  const intro = canPrompt
    ? 'Nhấn nút dưới đây rồi chọn Cài đặt để có biểu tượng AN GIA trên màn hình chính.'
    : 'Không bắt buộc, nhưng giúp mở AN GIA nhanh hơn. Làm 3 bước sau trong Chrome:';
  return (
    <GuideCard
      id="android-install-title"
      title="Cài AN GIA lên màn hình chính"
      intro={intro}
      steps={canPrompt ? [] : STEPS}
    >
      {canPrompt && (
        <button
          className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#004135] px-5 text-sm font-semibold text-white hover:bg-[#20594b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          onClick={onInstall}
        >
          <PushIcon name="addSquare" /> Cài AN GIA lên điện thoại
        </button>
      )}
    </GuideCard>
  );
}
