import type { Database } from '@src/shared/db/createDatabase.js';
import { createMemberPasswordResets } from './createMemberPasswordResets.js';
import { createPasswordResetNotices } from './createPasswordResetNotices.js';

export function createPasswordResetDependencies(db: Database) {
  return {
    memberPasswordResets: createMemberPasswordResets(db),
    passwordResetNotices: createPasswordResetNotices(db),
  };
}
