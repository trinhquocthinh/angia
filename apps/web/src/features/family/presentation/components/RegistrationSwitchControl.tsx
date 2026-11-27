import type { useRegistrationSwitch } from '../../application/useRegistrationSwitch';

type Props = ReturnType<typeof useRegistrationSwitch> & { onToggle: (open: boolean) => void };
export function RegistrationSwitchControl({ registration, save, onToggle }: Props) {
  return (
    <>
      {registration.isError ? (
        <div>
          <p role="alert" className="text-danger">
            Không tải được trạng thái đăng ký.
          </p>
          <button
            type="button"
            className="min-h-12 rounded-2xl border border-border px-4"
            onClick={() => void registration.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : registration.data ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-bg p-4">
          <div>
            <p className="m-0 font-semibold">Cho phép người dùng mới tự đăng ký</p>
            <p className="mb-0 text-caption text-text-secondary">Khi tắt, người mới cần lời mời lập nhà.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Cho phép tự đăng ký"
            aria-checked={registration.data.registrationOpen}
            disabled={save.isPending}
            className="flex min-h-12 min-w-14 shrink-0 items-center justify-center rounded-2xl"
            onClick={() => {
              save.reset();
              onToggle(!registration.data!.registrationOpen);
            }}
          >
            <span
              aria-hidden="true"
              className={`flex h-8 w-14 items-center rounded-full px-1 ${registration.data.registrationOpen ? 'justify-end bg-accent' : 'justify-start bg-border'}`}
            >
              <span className="size-6 rounded-full bg-surface shadow-sm" />
            </span>
          </button>
        </div>
      ) : (
        <p role="status" className="animate-pulse rounded-2xl bg-bg p-4 text-text-secondary">
          Đang tải trạng thái đăng ký…
        </p>
      )}
    </>
  );
}
