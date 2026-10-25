import { InvitationIcon } from './InvitationIcon';
export function InvitationLinkInput({ url, onCopy }: { url: string; onCopy: () => void }) {
  return (
    <div className="relative mt-2">
      <input
        id="invitation-link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="block min-h-12 w-full rounded-xl bg-[#e4f0f0] py-3 pl-3.5 pr-12 font-mono text-xs outline-offset-2 focus:outline-[#286958]"
      />
      <button
        type="button"
        aria-label="Sao chép nhanh link mời"
        onClick={onCopy}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#286958] hover:bg-[#f0fcfb]"
      >
        <InvitationIcon name="copy" />
      </button>
    </div>
  );
}
