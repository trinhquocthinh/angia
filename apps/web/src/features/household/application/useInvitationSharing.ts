import { useRef, useState } from 'react';
import type { Invitation, InvitationSharing } from './invitationPorts';

export function useInvitationSharing(port: InvitationSharing) {
  const [message, setMessage] = useState('');
  const [sequence, setSequence] = useState(0);
  function notify(value: string) {
    setMessage(value);
    setSequence((id) => id + 1);
  }
  const [manual, setManual] = useState('');
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  async function copy(text: string, label: string) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setManual('');
    try {
      if (await port.copy(text)) notify(label);
      else {
        setManual(text);
        notify('Chưa thể sao chép. Bạn có thể chọn và sao chép nội dung dưới đây.');
      }
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function share(invitation: Invitation) {
    if (locked.current || !port.share) return;
    locked.current = true;
    setPending(true);
    setManual('');
    try {
      const result = await port.share(invitation);
      if (result === 'shared') notify('Đã chia sẻ lời mời.');
      else if (result === 'failed') notify('Chưa thể chia sẻ. Bạn có thể sao chép mã hoặc link.');
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { pending, message, sequence, manual, copy, share, canShare: Boolean(port.share) };
}
