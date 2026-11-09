import { describe, expect, it } from 'vitest';
import { getPainIssue } from './getPainIssue.js';
import { listPainIssues } from './listPainIssues.js';
import { getPainIssueDeletionImpact } from './getPainIssueDeletionImpact.js';
import { updatePainIssue } from './updatePainIssue.js';
import { resolvePainIssue } from './resolvePainIssue.js';
import { reopenPainIssue } from './reopenPainIssue.js';
import { deletePainIssue } from './deletePainIssue.js';
import { issue, now, painIssueFixture, session, summary, target } from './painIssueTestFixture.js';
import type { PainIssueRepository } from './ports.js';

const operations = [
  { name: 'chi tiết', run: (r: PainIssueRepository) => getPainIssue(r, target) },
  { name: 'tác động xóa', run: (r: PainIssueRepository) => getPainIssueDeletionImpact(r, target) },
  { name: 'sửa', run: (r: PainIssueRepository) => updatePainIssue(r, session, null, now) },
  { name: 'đóng', run: (r: PainIssueRepository) => resolvePainIssue(r, session, null, now) },
  { name: 'mở lại', run: (r: PainIssueRepository) => reopenPainIssue(r, session, null, now) },
  { name: 'xóa', run: (r: PainIssueRepository) => deletePainIssue(r, session, null) },
];

describe('Thứ tự phạm vi → consent → hợp đồng — SPEC-052 đến 055', () => {
  it.each(operations)('TC-666: $name không tiết lộ consent khi đối tượng ngoài phạm vi', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findProfile.mockResolvedValue({ consentStatus: 'withdrawn' });
    store.findIssue.mockResolvedValue(null);
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.findIssue).toHaveBeenCalledWith(target.profileId, target.issueId, expect.any(Boolean));
    expect(store.updateIssue).not.toHaveBeenCalled();
    expect(store.changeStatus).not.toHaveBeenCalled();
    expect(store.deleteIssue).not.toHaveBeenCalled();
  });

  it.each(operations)('TC-665: $name kiểm consent trước hợp đồng', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue,
      consentStatus: 'pending',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
    expect(store.getDetail).not.toHaveBeenCalled();
    expect(store.countImpact).not.toHaveBeenCalled();
    expect(store.updateIssue).not.toHaveBeenCalled();
    expect(store.changeStatus).not.toHaveBeenCalled();
    expect(store.deleteIssue).not.toHaveBeenCalled();
  });

  it.each(operations)('TC-666: $name không dùng vấn đề của hồ sơ khác dù port trả nhầm', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, healthProfileId: 'other-profile' },
      consentStatus: 'withdrawn',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.getDetail).not.toHaveBeenCalled();
    expect(store.countImpact).not.toHaveBeenCalled();
    expect(store.updateIssue).not.toHaveBeenCalled();
    expect(store.changeStatus).not.toHaveBeenCalled();
    expect(store.deleteIssue).not.toHaveBeenCalled();
  });

  it.each(operations)('TC-666: $name không dùng vấn đề khác cùng hồ sơ dù port trả nhầm', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, id: 'other-issue' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });

  it('TC-669: danh sách kiểm phạm vi/consent trước bộ lọc', async () => {
    const { repository, store } = painIssueFixture();
    store.findProfile.mockResolvedValue(null);
    expect(await listPainIssues(repository, target, { status: 'foo' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    store.findProfile.mockResolvedValue({ consentStatus: 'withdrawn' });
    expect(await listPainIssues(repository, target, { status: 'foo' })).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(store.listIssues).not.toHaveBeenCalled();
  });

  it('TC-670: đối tượng bị xóa trước khi đọc detail vẫn trả NOT_FOUND', async () => {
    const { repository, store } = painIssueFixture();
    store.getDetail.mockResolvedValue(null);
    expect(await getPainIssue(repository, target)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
