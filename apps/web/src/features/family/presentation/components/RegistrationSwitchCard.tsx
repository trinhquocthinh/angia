import { RegistrationSwitchControl } from './RegistrationSwitchControl';
import { useState } from 'react';
import type { useRegistrationSwitch } from '../../application/useRegistrationSwitch';
import { AdminRequestError } from '../../application/AdminRequestError';
import { RegistrationCardHeading } from './RegistrationCardHeading';
import { RegistrationSwitchDialog } from './RegistrationSwitchDialog';

export function RegistrationSwitchCard({ registration, save }: ReturnType<typeof useRegistrationSwitch>) {
  const [target, setTarget] = useState<boolean | null>(null);
  const error = save.error
    ? save.error instanceof AdminRequestError && save.error.code === 'ERR_FORBIDDEN'
      ? 'Bạn không có quyền thay đổi cài đặt này.'
      : 'Không lưu được. Thử lại sau.'
    : null;
  return (
    <article
      aria-label="Mở đăng ký công khai"
      className="profile-bento-card flex min-w-0 flex-col gap-5 p-5 sm:p-6"
    >
      <RegistrationCardHeading title="Mở đăng ký công khai" icon="how_to_reg" />
      <RegistrationSwitchControl registration={registration} save={save} onToggle={setTarget} />
      {target !== null && (
        <RegistrationSwitchDialog
          open={target}
          pending={save.isPending}
          error={error}
          onClose={() => setTarget(null)}
          onConfirm={() => save.mutate(target, { onSuccess: () => setTarget(null) })}
        />
      )}
    </article>
  );
}
