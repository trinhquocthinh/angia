import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useTemperatureForm } from './useTemperatureForm';

function setup(pending = false) {
  const save = vi.fn(async () => 'saved' as const);
  let state: ReturnType<typeof useTemperatureForm> | undefined;
  function Probe() {
    state = useTemperatureForm(pending, save);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  state!.form.register('celsius');
  state!.form.register('measuredAt');
  return { state: state!, save };
}
describe('Điều khiển form nhiệt độ', () => {
  it('TC-500: nhập dấu phẩy, gửi giờ Việt Nam và chưa xác nhận mặc định', async () => {
    const { state, save } = setup();
    state.form.setValue('celsius', '38,46');
    state.form.setValue('measuredAt', '2020-01-01T13:50');
    await state.submit();
    expect(save).toHaveBeenCalledWith({
      celsius: 38.46,
      measuredAt: '2020-01-01T06:50:00.000Z',
      confirmOutOfRange: false,
    });
  });
  it('TC-501: dữ liệu sai và đang gửi không gọi lưu', async () => {
    const invalid = setup();
    invalid.state.form.setValue('celsius', '51');
    invalid.state.form.setValue('measuredAt', '2020-01-01T13:50');
    await invalid.state.submit();
    expect(invalid.save).not.toHaveBeenCalled();
    expect(invalid.state.form.getFieldState('celsius').error?.message).toContain('25,0');
    const busy = setup(true);
    busy.state.form.setValue('celsius', '38,5');
    busy.state.form.setValue('measuredAt', '2020-01-01T13:50');
    await busy.state.submit();
    expect(busy.save).not.toHaveBeenCalled();
  });
});
