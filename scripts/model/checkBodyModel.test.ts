import { bodyRegions } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import { checkBodyModel } from './checkBodyModel.js';

const allRegionNodes = Object.entries(bodyRegions).flatMap(([region, { sides }]) =>
  sides.map((side) => `region__${region}__${side}`),
);
const valid = { byteLength: 213_628, nodeNames: ['body', 'regions', ...allRegionNodes], hasProvenance: true };

describe('checkBodyModel', () => {
  it('TC-731 mô hình đạt: đủ 35 vị trí, ≤ 1,5 MB, có PROVENANCE.md', () => {
    expect(allRegionNodes).toHaveLength(35);
    expect(checkBodyModel(valid)).toEqual([]);
  });

  it('TC-731 tệp vượt 1,5 MB bị báo lỗi, đúng 1,5 MB vẫn đạt', () => {
    expect(checkBodyModel({ ...valid, byteLength: 1.5 * 1024 * 1024 })).toEqual([]);
    expect(checkBodyModel({ ...valid, byteLength: 1.5 * 1024 * 1024 + 1 })).toEqual([
      expect.stringContaining('vượt trần 1,5 MB'),
    ]);
  });

  it('TC-731 node vùng không thuộc danh mục (sai mã, sai bên, thừa phần) bị báo lỗi', () => {
    const extra = ['region__tail__center', 'region__head__left', 'region__knee__left__extra'];
    const errors = checkBodyModel({ ...valid, nodeNames: [...valid.nodeNames, ...extra] });
    expect(errors).toEqual(extra.map((name) => expect.stringContaining(name)));
  });

  it('TC-731 thiếu vị trí bị báo lỗi kèm tên node thiếu', () => {
    const nodeNames = valid.nodeNames.filter((name) => name !== 'region__elbow__right');
    expect(checkBodyModel({ ...valid, nodeNames })).toEqual([
      expect.stringContaining('region__elbow__right'),
    ]);
  });

  it('TC-731 một vị trí có hai node bị báo lỗi', () => {
    const errors = checkBodyModel({ ...valid, nodeNames: [...valid.nodeNames, 'region__knee__left'] });
    expect(errors).toEqual([expect.stringContaining('region__knee__left')]);
  });

  it('TC-731 thiếu PROVENANCE.md bị báo lỗi', () => {
    expect(checkBodyModel({ ...valid, hasProvenance: false })).toEqual([
      expect.stringContaining('PROVENANCE.md'),
    ]);
  });
});
