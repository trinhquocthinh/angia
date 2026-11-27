import { createAdminAuditRepository } from '@src/features/adminAudit/infrastructure/createAdminAuditRepository.js';
import { createAdminStatsRepository } from '@src/features/adminStats/infrastructure/createAdminStatsRepository.js';
import { createAccountLockRepository } from '@src/features/accountLock/infrastructure/createAccountLockRepository.js';
import { createRegistrationSwitchRepository } from '@src/features/registrationSwitch/infrastructure/createRegistrationSwitchRepository.js';
import { createRegistrationGate } from '@src/features/account/infrastructure/createRegistrationGate.js';
import type { Database } from '@src/shared/db/createDatabase.js';

// Tách lắp ráp quản trị tài khoản để composition root giữ giới hạn kích thước.
export function createAdminAccountDependencies(db: Database) {
  return {
    adminAudit: { repository: createAdminAuditRepository(db) },
    adminStats: { repository: createAdminStatsRepository(db) },
    accountLock: { repository: createAccountLockRepository(db) },
    registrationSwitch: {
      repository: createRegistrationSwitchRepository(db),
      gate: createRegistrationGate(db),
    },
  };
}
