import { describe, expect, it } from 'vitest';
import { readRegionPickerMode, saveRegionPickerMode } from './regionPickerModeStorage';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};
const broken = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('Nhớ chế độ chọn vùng trên thiết bị (SPEC-058)', () => {
  it('lần đầu mở mặc định "Hình", kể cả khi có WebGL', () => {
    expect(readRegionPickerMode(true, memory())).toBe('image');
  });

  it('lần trước chọn "3D" thì mở thẳng "3D"', () => {
    const storage = memory();
    saveRegionPickerMode('3d', storage);
    expect(readRegionPickerMode(true, storage)).toBe('3d');
  });

  it('nhớ "Danh sách"', () => {
    const storage = memory();
    saveRegionPickerMode('list', storage);
    expect(readRegionPickerMode(false, storage)).toBe('list');
  });

  it('TC-730: nhớ "3D" nhưng thiết bị không có WebGL thì mở "Hình"', () => {
    const storage = memory();
    saveRegionPickerMode('3d', storage);
    expect(readRegionPickerMode(false, storage)).toBe('image');
  });

  it('giá trị lạ hoặc lưu trữ bị chặn thì dùng "Hình", không ném lỗi', () => {
    const storage = memory();
    storage.setItem('angia.painRegionPickerMode', 'vr');
    expect(readRegionPickerMode(true, storage)).toBe('image');
    expect(readRegionPickerMode(true, broken)).toBe('image');
    expect(() => saveRegionPickerMode('3d', broken)).not.toThrow();
  });
});
