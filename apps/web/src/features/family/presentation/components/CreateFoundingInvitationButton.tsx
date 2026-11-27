type Props = { pending: boolean; onCreate: () => void };
export function CreateFoundingInvitationButton({ pending, onCreate }: Props) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onCreate}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-semibold text-on-accent"
    >
      <img
        src="/images/household/stitch/admin-add.svg"
        className="size-6 shrink-0 [html[data-theme=dark]_&]:invert"
        width="24"
        height="24"
        alt=""
      />
      {pending ? 'Đang tạo lời mời…' : 'Tạo lời mời lập nhà'}
    </button>
  );
}
