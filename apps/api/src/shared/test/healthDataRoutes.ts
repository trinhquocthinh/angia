// Kiểm kê route theo NFR-4. Route mới phải được xếp vào một nhóm, nếu không TC-107 đỏ;
// route dữ liệu sức khỏe còn phải có ca kiểm thử trong crossFamilyIsolation.int.test.ts.
//  - scoped: nhắm tài nguyên của gia đình qua ID/token → expectCrossFamilyDenied.
//  - list:   trả danh sách theo gia đình của phiên → không lẫn dữ liệu gia đình khác.
//  - uniform: không chạm dữ liệu, mọi ID nhận cùng một phản hồi.
export const HEALTH_DATA_ROUTES = {
  'GET /api/health-profiles': 'list',
  'GET /api/health-profiles/linkable-accounts': 'list',
  'POST /api/health-profiles': 'scoped',
  'POST /api/health-profiles/:id/consent': 'uniform',
  'POST /api/health-profiles/:id/consent-invitations': 'scoped',
  'DELETE /api/health-profiles/:id/consent-invitations': 'scoped',
  'GET /api/consent-invitations/view': 'scoped',
  'POST /api/consent-invitations/respond': 'scoped',
  'POST /api/health-profiles/:id/upload-batches': 'scoped',
  'GET /api/source-documents': 'list',
  'GET /api/source-documents/:id/review': 'scoped',
  'GET /api/source-documents/:id/image': 'scoped',
  'POST /api/source-documents/:id/approve': 'scoped',
  'POST /api/source-documents/:id/reject': 'scoped',
  'POST /api/source-documents/:id/privacy-drafts': 'scoped',
  'GET /api/source-documents/:id/privacy-draft': 'scoped',
  'GET /api/source-documents/:id/privacy-drafts/:draftId/image': 'scoped',
  'POST /api/source-documents/:id/privacy-approval': 'scoped',
  'POST /api/source-documents/:id/manual-entry': 'scoped',
  'GET /api/health-profiles/:id/measurements': 'scoped',
  'POST /api/health-profiles/:id/manual-records': 'scoped',
} as const;

type HealthDataRoute = keyof typeof HEALTH_DATA_ROUTES;
// Record<RouteOfKind<'scoped'>, …> buộc test liệt kê đủ route của nhóm ngay lúc typecheck.
export type RouteOfKind<Kind extends string> = {
  [K in HealthDataRoute]: (typeof HEALTH_DATA_ROUTES)[K] extends Kind ? K : never;
}[HealthDataRoute];

// Không chứa dữ liệu sức khỏe: hạ tầng, xác thực, quản trị nhóm/tài khoản (BR-006) và trần ngân sách AI
// toàn hệ thống (SPEC-013, chỉ số tiền theo tháng).
export const NON_HEALTH_DATA_ROUTES: readonly string[] = [
  'GET /api/health',
  'GET /api/auth/login',
  'GET /api/auth/callback',
  'POST /api/auth/logout',
  'GET /api/me',
  'GET /api/admin/families',
  'POST /api/admin/families',
  'GET /api/admin/accounts',
  'POST /api/admin/accounts/:id/membership',
  'PATCH /api/admin/accounts/:id/membership',
  'GET /api/admin/extraction-cap',
  'PUT /api/admin/extraction-cap',
];
