import { AdminIcon } from './AdminIcon';

export function AdminHeading({
  families,
  accounts,
  waiting,
  disabled,
  onCreate,
}: {
  families: number;
  accounts: number;
  waiting: number;
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <section className="profile-bento-card relative flex flex-col justify-between gap-5 overflow-hidden p-6 sm:flex-row sm:items-end sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-8 h-64 w-64 rounded-full bg-accent-fixed/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-secondary-container/25 blur-2xl"
      />
      <div className="relative z-10 flex min-w-0 flex-col gap-2">
        <p className="m-0 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-caption font-semibold uppercase tracking-wider text-accent">
          <span aria-hidden="true" className="size-2 rounded-full bg-secondary" />
          Trung tâm điều phối hệ thống
        </p>
        <h1 className="auth-heading m-0 text-heading-1 font-semibold tracking-tight text-accent">
          Quản trị hệ thống
        </h1>
        <p className="m-0 text-body text-text-secondary tabular-nums">
          {families} nhóm gia đình · {accounts} tài khoản
          {waiting > 0 && ` · ${waiting} tài khoản chờ vào nhóm`}
        </p>
      </div>
      <button
        type="button"
        className="relative z-10 inline-flex min-h-btn shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover"
        disabled={disabled}
        onClick={onCreate}
      >
        <AdminIcon name="group_add" />
        Tạo nhóm gia đình
      </button>
    </section>
  );
}
