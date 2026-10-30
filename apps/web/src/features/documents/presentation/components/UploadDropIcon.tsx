import { DocumentIcon } from './DocumentIcon';

const SHEET =
  'absolute inset-0 rounded-2xl transition-[rotate,translate] duration-300 ease-out motion-reduce:transition-none';

// Biểu tượng vùng thả: hai tờ giấy lót phía sau xòe ra khi rê chuột, xòe rộng hơn khi kéo ảnh vào.
export function UploadDropIcon({ over, disabled }: { over: boolean; disabled: boolean }) {
  const hover = (classes: string) => (disabled ? '' : classes);
  return (
    <span className="relative mb-4 h-16 w-16">
      <span
        aria-hidden="true"
        className={`${SHEET} bg-[#deebea] ${
          over
            ? '-translate-x-2 -rotate-[14deg]'
            : `-rotate-6 ${hover('group-hover:-translate-x-1 group-hover:-rotate-[10deg]')}`
        }`}
      />
      <span
        aria-hidden="true"
        className={`${SHEET} bg-[#b4eedc] ${
          over
            ? 'translate-x-2 rotate-[14deg]'
            : `rotate-6 ${hover('group-hover:translate-x-1 group-hover:rotate-[10deg]')}`
        }`}
      />
      <span
        className={`relative flex h-full w-full items-center justify-center rounded-2xl bg-[#aef0da] text-[#004135] shadow-sm transition-[translate] duration-300 ease-out motion-reduce:transition-none ${
          over ? '-translate-y-1' : hover('group-hover:-translate-y-0.5')
        }`}
      >
        {over && (
          <span
            aria-hidden="true"
            className="upload-drop-halo absolute inset-0 rounded-2xl bg-[#286958]/25"
          />
        )}
        <DocumentIcon name={disabled ? 'lock' : 'upload'} size={32} />
      </span>
    </span>
  );
}
