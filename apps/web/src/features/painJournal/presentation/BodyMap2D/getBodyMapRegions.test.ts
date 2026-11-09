import { bodyLocationSchema, bodyRegions } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import { getBodyMapRegions } from './getBodyMapRegions';

describe('Danh mục vùng của hình cơ thể 2D', () => {
  it('SPEC-051: hai mặt cho chọn đủ 35 vị trí hợp lệ, không lặp vị trí trong một mặt', () => {
    const locations = new Set<string>();
    for (const view of ['front', 'back'] as const) {
      const regions = getBodyMapRegions(view);
      const keys = regions.map(({ region, side }) => `${region}/${side}`);
      expect(new Set(keys).size).toBe(regions.length);
      for (const item of regions) {
        expect(bodyLocationSchema.safeParse({ region: item.region, side: item.side }).success).toBe(true);
        expect(item.path.length).toBeGreaterThan(0);
        locations.add(`${item.region}/${item.side}`);
      }
    }
    expect(locations.size).toBe(35);
    for (const [region, { sides }] of Object.entries(bodyRegions)) {
      for (const side of sides) expect(locations.has(`${region}/${side}`)).toBe(true);
    }
  });

  it('F-34: mặt trước chứa ngực, bụng, chậu và cẳng chân trước; mặt sau chứa lưng, mông và bắp chân', () => {
    const front = getBodyMapRegions('front').map(({ region }) => region);
    const back = getBodyMapRegions('back').map(({ region }) => region);
    expect(front).toEqual(expect.arrayContaining(['chest', 'abdomen', 'pelvis', 'shin']));
    expect(back).toEqual(expect.arrayContaining(['upper_back', 'lower_back', 'buttock', 'calf']));
    for (const region of ['upper_back', 'lower_back', 'buttock', 'calf']) {
      expect(front).not.toContain(region);
    }
    for (const region of ['chest', 'abdomen', 'pelvis', 'shin']) expect(back).not.toContain(region);
  });

  it.each([
    ['front', 'left', true],
    ['front', 'right', false],
    ['back', 'left', false],
    ['back', 'right', true],
  ] as const)('F-34: mặt %s, bên %s đặt đúng phía người trong hình', (view, side, mirrored) => {
    const regions = getBodyMapRegions(view).filter((item) => item.side === side);
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) expect(region.mirrored).toBe(mirrored);
  });

  it('F-34: nhãn có dấu, vùng giữa không thêm bên; thứ tự theo danh mục dùng chung', () => {
    const front = getBodyMapRegions('front');
    expect(front[0]).toMatchObject({ region: 'head', side: 'center', label: 'Đầu', mirrored: false });
    expect(front.find(({ region, side }) => region === 'knee' && side === 'left')?.label).toBe(
      'Đầu gối · trái',
    );
    expect(front.find(({ region, side }) => region === 'wrist' && side === 'right')?.label).toBe(
      'Cổ tay · phải',
    );
    const knees = front.filter(({ region }) => region === 'knee');
    expect(knees.map(({ side }) => side)).toEqual(['left', 'right']);
  });
});
