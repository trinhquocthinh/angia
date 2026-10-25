import { describe, expect, it, vi } from 'vitest';
import type { SessionContext } from '../domain/SessionContext.js';
import type { ResolveSessionDeps } from './ports.js';
import { resolveSession } from './resolveSession.js';

const NOW = new Date('2026-10-05T03:00:00.000Z');

function sessionExpiringAt(expiresAt: Date): SessionContext {
  return {
    sessionId: 'session-1',
    csrfToken: 'csrf-1',
    expiresAt,
    account: { id: 'account-1', displayName: 'Thịnh', isSystemAdmin: false, healthProfileId: null },
    family: null,
    role: null,
  };
}

function setup(found: SessionContext | null): ResolveSessionDeps {
  return {
    sessions: {
      create: vi.fn(),
      findActive: vi.fn().mockResolvedValue(found),
      extend: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    },
    now: () => NOW,
  };
}

describe('resolveSession', () => {
  it('chỉ tìm phiên còn hạn tại thời điểm hiện tại', async () => {
    const deps = setup(null);
    await resolveSession(deps, 'session-1');
    expect(deps.sessions.findActive).toHaveBeenCalledWith('session-1', NOW);
  });

  it('không có phiên còn hạn thì trả null và không gia hạn', async () => {
    const deps = setup(null);
    expect(await resolveSession(deps, 'session-1')).toBeNull();
    expect(deps.sessions.extend).not.toHaveBeenCalled();
  });

  it('phiên vừa tạo thì trả nguyên ngữ cảnh, không ghi DB', async () => {
    const session = sessionExpiringAt(new Date('2026-11-04T03:00:00.000Z'));
    const deps = setup(session);
    expect(await resolveSession(deps, 'session-1')).toEqual({ session, refreshed: false });
    expect(deps.sessions.extend).not.toHaveBeenCalled();
  });

  it('phiên đã trôi ≥ 1 ngày thì trượt hạn thêm 30 ngày kể từ bây giờ', async () => {
    const deps = setup(sessionExpiringAt(new Date('2026-10-20T03:00:00.000Z')));
    const extended = new Date('2026-11-04T03:00:00.000Z');
    const result = await resolveSession(deps, 'session-1');
    expect(deps.sessions.extend).toHaveBeenCalledWith('session-1', extended);
    expect(result).toMatchObject({ refreshed: true, session: { expiresAt: extended } });
  });
});
