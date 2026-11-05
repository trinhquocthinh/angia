import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from '../application/ports';
import { useEditProfileForm } from './useEditProfileForm';
function mount(birthYear: number | null, vitalsEnabled = false, success = true) {
  const save = vi.fn(async () => success);
  const close = vi.fn();
  let form: ReturnType<typeof useEditProfileForm>;
  function Probe() {
    form = useEditProfileForm({ birthYear, vitalsEnabled } as HealthProfile, save, close);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { form: form!, save, close };
}
afterEach(() => vi.useRealTimers());
describe('TC-449 — gửi form sửa hồ sơ', () => {
  it.each([null, 1899, 2027])('không gọi lưu hoặc đóng khi năm sinh là %s', async (year) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T00:00:00Z'));
    const { form, save, close } = mount(year);
    form.onSubmit();
    expect(save).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
  it.each([true, false])('gửi false để trở về theo tuổi; chỉ đóng khi lưu thành công %s', async (success) => {
    const { form, save, close } = mount(2020, false, success);
    form.onSubmit();
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith({ birthYear: 2020, vitalsEnabled: false }));
    expect(close).toHaveBeenCalledTimes(success ? 1 : 0);
  });
});
