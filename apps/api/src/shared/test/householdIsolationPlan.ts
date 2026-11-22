// E29-S4-T1: POST /api/me/account-deletion tự thao tác, DTO strict và nhà cũ kiểm tại accountDeletionRoutes.int.test.ts.
// E28-S3-T2: hai GET current kiểm cô lập tại currentHousehold{OwnershipOffer,DeletionRequest}.int.test.ts.
// E28-S3-T1: GET /api/family/members kiểm cô lập tại listHouseholdMembers.int.test.ts.
// Probe lời mời T2/T3 tại householdInvitations, acceptHouseholdInvitation và foundingInvitations.int.test.ts.
// E28-S1-T1: PATCH /api/family/members/:targetAccountId (cả đổi vai trò/gỡ) tại householdMembership.int.test.ts.
// E28-S1-T2: tự rời nhà và truy cập nhà cũ tại leaveHousehold.int.test.ts.
// E28-S2-T1: đề nghị/trả lời/thu hồi tại ownershipOffers.int.test.ts.
// E28-S2-T2: yêu cầu/thu hồi xoá nhà tại familyDeletionRequests.int.test.ts.
// E28-S2-T3: giám hộ kiểm thực thi tại profileGuardians.int.test.ts và createHealthDataProbes.
// Các route chưa có trên HEAD. Khi thêm route, thay mục kế hoạch bằng probe thực thi;
// không chấp nhận 404 của router làm bằng chứng cô lập.
export const HOUSEHOLD_ROUTE_PLAN = [
  { route: 'POST /api/me/data-exports', task: 'E29-S3-T1' },
  { route: 'GET /api/me/data-exports/:id/download', task: 'E29-S3-T2' },
] as const;

export const HOUSEHOLD_RLS_TABLES = [
  'family_invitations',
  'ownership_transfer_offers',
  'family_deletion_requests',
  'profile_guardians',
  'removed_member_windows',
] as const;
