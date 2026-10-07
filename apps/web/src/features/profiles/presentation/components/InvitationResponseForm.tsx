import { InvitationResponseActions } from './InvitationResponseActions';
import { InvitationIcon } from './InvitationIcon';
import { useRef, useState } from 'react';
import type { InvitationDraft } from '../../application/invitationPorts';
import { readInvitationDraft } from '../../application/readInvitationDraft';
import { InvitationIdentityFields } from './InvitationIdentityFields';
export function InvitationResponseForm({
  pending,
  onRespond,
}: {
  pending: boolean;
  onRespond: (body: InvitationDraft) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [basis, setBasis] = useState<'self' | 'guardian' | null>(null);
  const [errors, setErrors] = useState<{ respondentName?: string; basis?: string }>({});
  const sending = useRef(false);
  const submit = async (decision: 'accepted' | 'declined') => {
    if (pending || sending.current) return;
    const draft = readInvitationDraft(name, basis, decision);
    setErrors(draft.errors);
    if (!draft.body) return;
    sending.current = true;
    try {
      await onRespond(draft.body);
    } finally {
      sending.current = false;
    }
  };
  return (
    <form onSubmit={(event) => event.preventDefault()} className="mt-6">
      <fieldset disabled={pending}>
        <InvitationIdentityFields
          name={name}
          basis={basis}
          setName={setName}
          setBasis={setBasis}
          errors={errors}
        />
        <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-[#eaf6f5]/70 p-3 text-xs leading-5 text-[#404945]">
          <InvitationIcon name="info" />
          <span>
            Tên và tư cách do bạn tự khai, chưa được xác minh. Link có thể được mở bởi người được chuyển tiếp;
            hãy chỉ phản hồi cho đúng hồ sơ.
          </span>
        </p>
        <InvitationResponseActions
          pending={pending}
          canRespond={Boolean(basis)}
          onDecision={(decision) => void submit(decision)}
        />
      </fieldset>
    </form>
  );
}
