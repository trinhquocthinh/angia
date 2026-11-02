import { InvitationLayout } from './components/InvitationLayout';
import { InvitationNotice } from './components/InvitationNotice';
// SPEC-040: link đồng thuận cũ đã ngừng; giữ tuyến để người cầm link cũ biết phải xin link mới.
export function ConsentInvitePage() {
  return (
    <InvitationLayout>
      <InvitationNotice title="Link không còn dùng">
        Link này không còn dùng. Hãy nhờ người quản lý gia đình gửi link liên kết mới.
      </InvitationNotice>
    </InvitationLayout>
  );
}
