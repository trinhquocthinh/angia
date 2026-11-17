import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { hashInvitationSecret } from '@src/features/household/infrastructure/hashInvitationSecret.js';
import { lookupJoinInvitation } from '@src/features/household/infrastructure/lookupJoinInvitation.js';
import type { InvitationVerifier, VerifiedInvitation } from '../application/ports.js';

export function createInvitationVerifier(db: Pick<Database, 'execute'>): InvitationVerifier {
  return {
    async verify(token: string): Promise<VerifiedInvitation | null> {
      const digest = hashInvitationSecret(token);
      const joined = await lookupJoinInvitation(db, digest);
      const { rows } = await db.execute<{ id: string }>(
        sql`SELECT id FROM public.lookup_founding_invitation(${digest})`,
      );
      if (joined && rows.length === 0)
        return { kind: 'join_family', familyId: joined.family_id, role: joined.role };
      return !joined && rows.length === 1 ? { kind: 'found_family' } : null;
    },
  };
}
