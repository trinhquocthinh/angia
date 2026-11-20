import { memberActionError } from '../../application/memberActionError';
import { MemberDetailLayout } from './MemberDetailLayout';
import { MemberEditorContent } from './MemberEditorContent';
import { PanelNotice } from './PanelNotice';
import { useMemberPanelActions } from './useMemberPanelActions';
import type { MemberEditorProps } from './memberEditorProps';

export function MemberEditorBody(props: MemberEditorProps) {
  const actions = useMemberPanelActions(props);
  const ownerProtected = memberActionError('ERR_OWNER_PROTECTED');
  const protectedError =
    actions.roleChange.error === ownerProtected || actions.removal.error === ownerProtected;
  // Giữ vỏ hiện tại khi xác nhận đang mở để thứ tự modal và request không bị ngắt bởi resize.
  return (
    <MemberDetailLayout
      isDesktop={actions.confirmOpen && !protectedError ? actions.confirmDesktop : props.isDesktop}
      returnFocusRef={props.returnFocusRef}
      onClose={props.onClose}
    >
      {protectedError ? (
        <PanelNotice message={ownerProtected} onClose={props.onClose} />
      ) : (
        <MemberEditorContent {...props} actions={actions} />
      )}
    </MemberDetailLayout>
  );
}
