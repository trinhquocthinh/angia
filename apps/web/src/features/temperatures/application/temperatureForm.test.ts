import { describe, expect, it } from 'vitest';
import { temperatureFormSchema } from './temperatureForm';

const schema = temperatureFormSchema(new Date('2026-11-04T07:00:00Z'));
describe('Nhập nhiệt độ bằng giờ Việt Nam', () => {
  it('TC-500: nhận dấu phẩy, giữ số gốc cho API làm tròn và chuyển giờ Việt Nam', () => {
    expect(schema.parse({ celsius: '38,46', measuredAt: '2026-11-04T13:50' })).toEqual({
      celsius: 38.46,
      measuredAt: '2026-11-04T06:50:00.000Z',
      confirmOutOfRange: false,
    });
  });
  it.each(['', 'NaN', '38abc', '24,99', '50,01'])('TC-501: chặn nhiệt độ không hợp lệ %s', (celsius) => {
    expect(schema.safeParse({ celsius, measuredAt: '2026-11-04T13:50' }).success).toBe(false);
  });
  it.each(['25', '50', '33,9', '48'])('TC-501: để API quyết định xác nhận cho %s', (celsius) => {
    expect(schema.safeParse({ celsius, measuredAt: '2026-11-04T13:50' }).success).toBe(true);
  });
  it.each(['2026-11-04T14:01', '2026-02-30T10:00', '', '2026-11-04'])(
    'TC-500: chặn ngày giờ sai hoặc tương lai %s',
    (measuredAt) => {
      expect(schema.safeParse({ celsius: '38,5', measuredAt }).success).toBe(false);
    },
  );
});
