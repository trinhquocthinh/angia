import { describe, expect, it } from 'vitest';
import { parseSendToAi } from './parseSendToAi.js';

describe('Cờ đồng ý gửi AI của lô tải lên (SPEC-008)', () => {
  it('TC-405: thiếu cờ luôn là tự nhập', () => {
    expect(parseSendToAi(undefined, 2)).toEqual([false, false]);
  });
  it('TC-405: giữ đúng thứ tự các cờ', () => {
    expect(parseSendToAi('[true,false,true]', 3)).toEqual([true, false, true]);
  });
  it.each(['[true]', '[true,false,false]', '["true",false]', '[1,0]', 'null', '{}', 'true', '['])(
    'TC-405: từ chối cờ sai kiểu hoặc độ dài: %s',
    (raw) => {
      expect(parseSendToAi(raw, 2)).toBeNull();
    },
  );
});
