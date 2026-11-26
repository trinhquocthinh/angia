import type { FileRouteTypes } from '../../src/app/routeTree.gen.js';
import { issue } from '../painJournalFixture.js';
import { REMINDER_ID } from '../reminderUiSeed.js';
import { REVIEW_ID } from '../reviewFixture.js';

export const routeIds = {
  profileId: '00000000-0000-4000-8000-000000000002',
  issueId: issue.id,
  reminderId: REMINDER_ID,
  documentId: REVIEW_ID,
  prescriptionId: '0199bc85-8918-7000-8000-000000000051',
};
export type RouteAccess = 'public' | 'main' | 'member' | 'admin' | 'noFamily' | 'enrollment';
export type AccessibilityRoute = {
  path: FileRouteTypes['fullPaths'];
  access: RouteAccess;
  suffix?: string;
  expectedPath?: string;
};

// Danh mục tường minh để route mới phải được bổ sung vào phép kiểm phủ bên dưới.
export const routes = [
  { path: '/', access: 'member' },
  { path: '/admin', access: 'admin' },
  { path: '/consent-invite', access: 'public' },
  { path: '/forgot-password', access: 'public' },
  { path: '/link-invite', access: 'public', expectedPath: '/login' },
  { path: '/login', access: 'public' },
  { path: '/my-profile', access: 'member' },
  { path: '/notifications', access: 'main' },
  { path: '/register', access: 'public' },
  { path: '/reset-password', access: 'public', suffix: '#token=v1.a11y_synthetic' },
  { path: '/upload', access: 'main' },
  { path: '/verify-email', access: 'public', suffix: '#token=v1.a11y_synthetic' },
  { path: '/waiting', access: 'public', expectedPath: '/login' },
  { path: '/account/', access: 'main' },
  { path: '/account/change-password', access: 'main' },
  { path: '/account/legal-update', access: 'main' },
  { path: '/account/local-password', access: 'enrollment' },
  { path: '/family/home', access: 'main' },
  { path: '/family/invite', access: 'main' },
  { path: '/profiles/$profileId', access: 'main' },
  { path: '/profiles/new', access: 'main' },
  { path: '/reminders/$reminderId', access: 'member' },
  { path: '/review/', access: 'main' },
  { path: '/review/$documentId', access: 'main' },
  { path: '/revisit-reminders/$reminderId', access: 'member' },
  // Route spike vẫn được đăng ký trong bản build, không có guard dev-only.
  { path: '/spike/body-3d', access: 'main' },
  { path: '/my-profile/pain/$issueId', access: 'member' },
  { path: '/profiles/$profileId/documents', access: 'main' },
  { path: '/profiles/$profileId/guardians', access: 'main' },
  { path: '/profiles/$profileId/lab-results', access: 'main' },
  { path: '/profiles/$profileId/manual', access: 'main' },
  { path: '/profiles/$profileId/medications', access: 'main' },
  { path: '/profiles/$profileId/pain', access: 'main' },
  { path: '/profiles/$profileId/reminders', access: 'main' },
  { path: '/profiles/$profileId/revisits', access: 'main' },
  { path: '/profiles/$profileId/summary', access: 'main' },
  { path: '/profiles/$profileId/timeline', access: 'main' },
  { path: '/profiles/$profileId/pain/$issueId', access: 'main' },
  { path: '/profiles/$profileId/prescriptions/$prescriptionId', access: 'main' },
  { path: '/profiles/$profileId/prescriptions/', access: 'main' },
  // Quét thêm màn thật sau đăng nhập, ngoài kiểm session 401 ở trên.
  { path: '/waiting', access: 'noFamily' },
  { path: '/link-invite', access: 'main', suffix: '#token=v1.a11y_synthetic' },
] as const satisfies readonly AccessibilityRoute[];

type MissingRoute = Exclude<FileRouteTypes['fullPaths'], (typeof routes)[number]['path']>;
// Lỗi typecheck nếu routeTree thêm route mà danh mục chưa bao phủ.
export const routeCoverage: Record<MissingRoute, never> = {};
