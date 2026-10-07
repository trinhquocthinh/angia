import { describe, expect, it } from 'vitest';
import { invitationLink } from './invitationLink';
import { readInvitationToken } from '../application/readInvitationToken';
const created = {
  token:
    'v1.7Lz_nx9mRkAXr2bON2n6zIb7WbeOh3dHW7hHq-AW8nPDk_7KENErihrpfE5rDcLzLqYdyTqVtAr9ltxO2_ZepYz7APJuqrUZweYO6sa6P2qJ-TCP3TH-JvRAN34SIvZwVJtq3l_7uFRgtgrW35Jdf78rVU8xSbWuaNds0X9a6CqR51x_5BqWH36HfJecvMVxn83yY-9YTIQpYALHvoJfa-XTmwRyxVvtlJIuppff8axbe4qhAMNs9eICiZVbqNj2nrO1Agc6KeJkU_YXLWZH6ZAIGol1Ajwg9ju6JDsWYFxjglpWOf-fC_znQMVQSw',
  expiresAt: '2026-10-13T00:00:00Z',
};
describe('TC-106 — Link main phát hành đi tới trang người nhận', () => {
  it('roundtrip token do backend codec thật phát hành qua fragment mà không vào query', () => {
    const url = new URL(invitationLink('https://sit.local', created.token));
    expect(url.pathname).toBe('/consent-invite');
    expect(url.search).toBe('');
    expect(readInvitationToken(url.hash)).toBe(created.token);
  });
});
