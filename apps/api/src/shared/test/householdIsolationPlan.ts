// Probe lời mời T2/T3 tại householdInvitations, acceptHouseholdInvitation và foundingInvitations.int.test.ts.
// E28-S1-T1: PATCH /api/family/members/:targetAccountId (cả đổi vai trò/gỡ) tại householdMembership.int.test.ts.
// Các route chưa có trên HEAD. Khi thêm route, thay mục kế hoạch bằng probe thực thi;
// không chấp nhận 404 của router làm bằng chứng cô lập.
export const HOUSEHOLD_ROUTE_PLAN = [
  { route: 'POST /api/family/leave', task: 'E28-S1-T2' },
  { route: 'POST /api/family/ownership-offers', task: 'E28-S2-T1' },
  { route: 'POST /api/family/ownership-offers/:id/decision', task: 'E28-S2-T1' },
  { route: 'DELETE /api/family/ownership-offers/:id', task: 'E28-S2-T1' },
  { route: 'POST /api/family/deletion-request', task: 'E28-S2-T2' },
  { route: 'DELETE /api/family/deletion-request', task: 'E28-S2-T2' },
  { route: 'POST /api/health-profiles/:id/guardians', task: 'E28-S2-T3' },
  { route: 'DELETE /api/health-profiles/:id/guardians/me', task: 'E28-S2-T3' },
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
