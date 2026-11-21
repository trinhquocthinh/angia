import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { AccountEmails } from '../application/ports.js';
import { createAccountEmailChanger } from './createAccountEmailChanger.js';
import { createEmailVerificationRequester } from './createEmailVerificationRequester.js';
import { createEmailVerificationConfirmer } from './createEmailVerificationConfirmer.js';

export function createAccountEmails(db: Database, boss: PgBoss, appBaseUrl: string): AccountEmails {
  return {
    change: createAccountEmailChanger(db),
    requestVerification: createEmailVerificationRequester(db, boss, appBaseUrl),
    confirmVerification: createEmailVerificationConfirmer(db),
  };
}
