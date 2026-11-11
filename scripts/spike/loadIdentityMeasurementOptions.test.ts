import { expect, it } from 'vitest';
import { loadIdentityMeasurementOptions } from './loadIdentityMeasurementOptions.js';

it('TC-873 bắt buộc ghi thời gian đã dùng và nguồn đo', () => {
  expect(loadIdentityMeasurementOptions(['--spent-minutes=120', '--origin=mac-tailscale'])).toEqual({
    spentMinutes: 120,
    origin: 'mac-tailscale',
  });
  expect(() => loadIdentityMeasurementOptions([])).toThrow('idp_invalid_measurement_options');
});

it.each(['-1', 'NaN', '361', ''])('TC-873 từ chối ngân sách đã dùng không hợp lệ: %s', (value) => {
  expect(() => loadIdentityMeasurementOptions([`--spent-minutes=${value}`, '--origin=mac'])).toThrow(
    'idp_invalid_measurement_options',
  );
});
