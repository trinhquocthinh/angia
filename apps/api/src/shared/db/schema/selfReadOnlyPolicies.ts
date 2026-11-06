import { sql } from 'drizzle-orm';
import { pgPolicy } from 'drizzle-orm/pg-core';

// Tech Spec §3.10.2: AND với policy gia đình; SELECT thường không chịu các policy ghi.
export const selfReadOnlyPolicies = () => {
  const notSelf = sql`NULLIF(current_setting('app.self_profile_id', true), '') IS NULL`;
  return [
    pgPolicy('self_read_only_insert', { as: 'restrictive', for: 'insert', to: 'public', withCheck: notSelf }),
    pgPolicy('self_read_only_update', {
      as: 'restrictive',
      for: 'update',
      to: 'public',
      using: notSelf,
      withCheck: notSelf,
    }),
    pgPolicy('self_read_only_delete', { as: 'restrictive', for: 'delete', to: 'public', using: notSelf }),
  ];
};
