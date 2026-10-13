import type { SeededSession } from './seedAuthFixtures.js';
// Tài nguyên đích của một request: của gia đình nạn nhân, hoặc toàn ID/token không tồn tại.
export interface Target {
  profileId: string;
  documentId: string;
  accountId: string;
  courseId: string;
  prescriptionId: string;
  token: string;
}
export type Probe = (user: SeededSession, target: Target) => Response | Promise<Response>;
