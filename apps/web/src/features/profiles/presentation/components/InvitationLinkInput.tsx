import { InvitationIcon } from './InvitationIcon';
export function InvitationLinkInput({ url, onCopy }: { url: string; onCopy: () => void }) {
  return (
    <div className="relative mt-2">
      <input
        id="invitation-link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="block min-h-12 w-full rounded-xl bg-accent-soft py-3 pl-3.5 pr-12 font-mono text-xs outline-offset-2 focus:outline-focus"
      />
      <button
        type="button"
        aria-label="Sao chép nhanh link liên kết"
        onClick={onCopy}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-accent hover:bg-bg"
      >
        <InvitationIcon name="copy" />
      </button>
    </div>
  );
}
