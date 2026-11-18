import { useInvitationExpiry } from '../../application/useInvitationExpiry';
import { useState } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { useCurrentInvitationModel } from '../../application/useCurrentInvitationModel';
import type { InvitationRole } from '../../application/invitationPorts';
import { currentInvitationRepository } from '../../infrastructure/currentInvitationRepository';
import { invitationRolePreference } from '../../infrastructure/invitationRolePreference';
import { InvitationManagementLoading } from './InvitationManagementLoading';
import { InvitationHeading } from './InvitationHeading';
import { InvitationRoleChoices } from './InvitationRoleChoices';
import { InvitationIssuedView } from './InvitationIssuedView';
export function HouseholdInvitationForm({ csrfToken, scope }: { csrfToken: string; scope: string }) {
  const model = useCurrentInvitationModel(currentInvitationRepository, csrfToken, scope);
  const [chosen, setChosen] = useState(() => invitationRolePreference.read(scope));
  const items = model.query.data?.items ?? [];
  const role = chosen ?? items.find((item) => item.role === 'member')?.role ?? items[0]?.role ?? null;
  const slot = items.find((item) => item.role === role);
  const expired = useInvitationExpiry(slot?.expiresAt);
  const status = slot?.status === 'active' && expired ? 'expired' : (slot?.status ?? 'active');
  function select(value: InvitationRole) {
    setChosen(value);
    invitationRolePreference.write(scope, value);
  }
  if (model.query.isPending || model.query.isError)
    return (
      <InvitationManagementLoading error={model.query.isError} retry={() => void model.query.refetch()} />
    );
  return (
    <section className="household-invite" aria-labelledby="household-invite-title">
      <InvitationHeading status={status} />
      <InvitationRoleChoices value={role} disabled={model.pending} onChange={select} />
      {slot ? (
        <InvitationIssuedView
          embedded
          key={slot.invitationId}
          invitation={{ ...slot, code: slot.code ?? '', link: slot.link ?? '' }}
          csrfToken={csrfToken}
          serverStatus={slot.status}
          pendingCreate={model.pending}
          onNew={() => {
            if (role) void model.create(role);
          }}
          onClosed={() => void model.query.refetch()}
        />
      ) : (
        <>
          <Button
            className="household-invite-primary"
            disabled={!role || model.pending || !csrfToken}
            onClick={() => {
              if (role) void model.create(role);
            }}
          >
            {model.pending ? 'Đang tạo lời mời…' : 'Tạo lời mời'}
          </Button>
        </>
      )}
      {model.error && (
        <p role="alert" className="household-invite-feedback text-danger">
          {model.error}
        </p>
      )}
    </section>
  );
}
