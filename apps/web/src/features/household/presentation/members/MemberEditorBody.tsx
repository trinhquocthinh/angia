import { useEffect } from 'react';
import { memberActionError } from '../../application/memberActionError';
import { MemberEditorContent } from './MemberEditorContent';
import { PanelNotice } from './PanelNotice';
import { useMemberPanelActions } from './useMemberPanelActions';
import type { MemberEditorProps } from './memberEditorProps';

export function MemberEditorBody(props: MemberEditorProps & { onPendingChange: (pending: boolean) => void }) {
  const actions = useMemberPanelActions(props);
  const pending = actions.pending;
  const { onPendingChange } = props;
  useEffect(() => {
    onPendingChange(pending);
    return () => onPendingChange(false);
  }, [pending, onPendingChange]);
  const ownerProtected = memberActionError('ERR_OWNER_PROTECTED');
  const protectedError =
    actions.roleChange.error === ownerProtected || actions.removal.error === ownerProtected;

  if (protectedError) {
    return <PanelNotice message={ownerProtected} onClose={props.onClose} />;
  }
  return <MemberEditorContent {...props} actions={actions} />;
}
