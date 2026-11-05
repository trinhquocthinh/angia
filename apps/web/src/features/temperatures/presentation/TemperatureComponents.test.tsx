import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TemperatureList } from './TemperatureList';
import { TemperatureForm } from './TemperatureForm';
import { TemperatureRange } from './TemperatureRange';

const reading = {
  id: 'r',
  celsius: 38.5,
  measuredAt: '2026-11-03T17:30:00Z',
  recordedBy: null,
  recordedAt: '2026-11-04T07:00:00Z',
};
describe('Trình bày nhiệt độ', () => {
  it('TC-502: giờ Việt Nam và dấu phẩy; tự xem không có nút xóa hay nhận định', () => {
    expect(renderToStaticMarkup(<TemperatureList readings={[]} pending={false} />)).toContain(
      'Chưa ghi nhiệt độ.',
    );
    const html = renderToStaticMarkup(<TemperatureList readings={[reading]} pending={false} />);
    expect(html).toContain('38,5 °C');
    expect(html).toContain('00:30 · 04/11/2026');
    expect(html).not.toMatch(/Xóa bản ghi|sốt cao|bất thường|đi khám/);
  });
  it('TC-500: main có hành động xóa và khóa khi gửi', () => {
    const html = renderToStaticMarkup(
      <TemperatureList readings={[reading]} pending onRemove={() => undefined} />,
    );
    expect(html).toContain('Xóa bản ghi');
    expect(html).toContain('disabled');
  });
  it('TC-500: form trống, có nhãn giờ Việt Nam và khóa gửi', () => {
    const html = renderToStaticMarkup(
      <TemperatureForm pending error={null} onSave={async () => 'saved'} onCancel={() => undefined} />,
    );
    expect(html).toContain('giờ Việt Nam');
    expect(html).toContain('fieldset disabled');
    expect(html).toContain('inputMode="decimal"');
    expect(html).not.toContain('value="38');
  });
  it('TC-502: khoảng ngày có nhãn và giữ bộ lọc đang áp dụng', () => {
    const html = renderToStaticMarkup(
      <TemperatureRange
        initial={{ from: '2026-11-01', to: '2026-11-04' }}
        pending={false}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('Từ ngày');
    expect(html).toContain('Đến ngày');
    expect(html).toContain('2026-11-01');
  });
});
