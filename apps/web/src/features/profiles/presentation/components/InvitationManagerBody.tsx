import { InvitationManagerHeader } from './InvitationManagerHeader';
import { InvitationManagerActions } from './InvitationManagerActions';
import { InvitationManagerNote } from './InvitationManagerNote';
import type { InvitationCreated } from '../../application/invitationPorts';
import { InvitationCopyField } from './InvitationCopyField';
import { InvitationIcon } from './InvitationIcon';
type Props = {
  name: string;
  invitationState: 'none' | 'active' | 'uncertain';
  created: InvitationCreated | null;
  pending: boolean;
  error: Error | null;
  message: string;
  create: () => Promise<void>;
  revoke: () => Promise<void>;
  close: () => void;
};
export function InvitationManagerBody({
  name,
  invitationState,
  created,
  pending,
  error,
  message,
  create,
  revoke,
  close,
}: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 p-6 sm:p-8">
        <InvitationManagerHeader name={name} onClose={close} />
        <InvitationManagerNote />
        {created && <InvitationCopyField key={created.token} created={created} />}
        <InvitationManagerActions
          invitationState={invitationState}
          pending={pending}
          create={create}
          revoke={revoke}
        />
        <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-[#286958]">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm leading-6 text-[#b42318]">
            {error.message}
          </p>
        )}
      </div>
      <footer className="flex items-start gap-3 border-t border-[#e4f0f0] bg-[#eaf6f5] p-6 text-[#404945]">
        <span className="text-[#286958]">
          <InvitationIcon name="shield" />
        </span>
        <div>
          <p className="text-xs font-semibold">Quyền riêng tư trong An Gia</p>
          <p className="mt-1 text-[11px] leading-5">Danh tính người phản hồi chưa được xác minh.</p>
        </div>
      </footer>
    </div>
  );
}
