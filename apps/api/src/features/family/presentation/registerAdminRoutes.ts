import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Account, Family as FamilyResponse } from '@angia/contracts';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { assignMembership } from '../application/assignMembership.js';
import { changeMembership } from '../application/changeMembership.js';
import { createFamily } from '../application/createFamily.js';
import { listAccounts } from '../application/listAccounts.js';
import { listFamilies } from '../application/listFamilies.js';
import type { FamilyAdminRepository } from '../application/ports.js';
import type { Family, MemberAccount } from '../domain/Membership.js';
import {
  assignMembershipRoute,
  changeMembershipRoute,
  createFamilyRoute,
  listAccountsRoute,
  listFamiliesRoute,
} from './adminRouteDefinitions.js';

const toFamilyResponse = (family: Family): FamilyResponse => ({
  ...family,
  createdAt: family.createdAt.toISOString(),
});

const toAccountResponse = (account: MemberAccount): Account => ({ ...account });

// Quản trị hệ thống chỉ quản lý cấu trúc nhóm/tài khoản, không đọc dữ liệu sức khỏe (BR-003, BR-006).
export function registerAdminRoutes(app: OpenAPIHono<AppEnv>, repository: FamilyAdminRepository): void {
  app.use('/api/admin/*', requireAdmin());

  app.openapi(listFamiliesRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json((await listFamilies(repository)).map(toFamilyResponse), 200);
  });

  app.openapi(createFamilyRoute, async (c) => {
    const family = await createFamily(repository, c.req.valid('json'));
    return c.json(toFamilyResponse(family), 201);
  });

  app.openapi(listAccountsRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json((await listAccounts(repository)).map(toAccountResponse), 200);
  });

  app.openapi(assignMembershipRoute, async (c) => {
    const outcome = await assignMembership(repository, {
      accountId: c.req.valid('param').id,
      ...c.req.valid('json'),
    });
    return outcome.ok ? c.json(toAccountResponse(outcome.account), 200) : c.json(...errorJson(outcome.code));
  });

  app.openapi(changeMembershipRoute, async (c) => {
    const outcome = await changeMembership(repository, {
      accountId: c.req.valid('param').id,
      change: c.req.valid('json'),
    });
    return outcome.ok ? c.json(toAccountResponse(outcome.account), 200) : c.json(...errorJson(outcome.code));
  });
}
