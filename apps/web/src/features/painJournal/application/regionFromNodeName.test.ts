import { describe, expect, it } from 'vitest';
import { regionFromNodeName } from './regionFromNodeName';

describe('regionFromNodeName', () => {
  it('đọc mã vùng và bên từ tên node `region__<code>__<side>`', () => {
    expect(regionFromNodeName('region__shoulder__left')).toEqual({ region: 'shoulder', side: 'left' });
    expect(regionFromNodeName('region__lower_back__center')).toEqual({
      region: 'lower_back',
      side: 'center',
    });
  });

  it('bỏ qua node thân, vùng ngoài danh mục và bên không hợp với vùng', () => {
    expect(regionFromNodeName('body')).toBeNull();
    expect(regionFromNodeName('region__tail__center')).toBeNull();
    expect(regionFromNodeName('region__head__left')).toBeNull();
    expect(regionFromNodeName('region__knee__left__extra')).toBeNull();
  });
});
