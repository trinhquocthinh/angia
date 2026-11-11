import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FULL_QUAD } from '../../application/scanCorners';
import { ScanCornerOverlay } from './ScanCornerOverlay';
import { ScanPanelActions } from './ScanPanelActions';
import { ScanTools } from './ScanTools';

const noop = () => {};
const actions = (step: 'corners' | 'preview' | 'confirm', valid = true) =>
  renderToStaticMarkup(
    <ScanPanelActions
      step={step}
      status="idle"
      valid={valid}
      clean
      onClean={noop}
      onPreview={noop}
      onStep={noop}
      onCancel={noop}
    />,
  );

describe('Giao diện nắn giấy (SPEC-084)', () => {
  it('TC-917: 4 tay nắm là nút có nhãn góc và hướng dẫn phím mũi tên', () => {
    const html = renderToStaticMarkup(
      <ScanCornerOverlay quad={FULL_QUAD} disabled={false} onChange={noop} />,
    );
    expect(html.match(/<button/g)).toHaveLength(4);
    for (const label of ['Góc trên trái', 'Góc trên phải', 'Góc dưới phải', 'Góc dưới trái'])
      expect(html).toContain(`aria-label="${label}. Dùng phím mũi tên để dịch`);
  });

  it('bước kéo góc: có ô "Làm sạch nền" bật sẵn; tứ giác sai thì khoá "Xem ảnh nắn"', () => {
    expect(actions('corners')).toContain('checked=""');
    expect(actions('corners')).toContain('Xem ảnh nắn');
    expect(actions('corners', false)).toMatch(/<button[^>]*disabled=""[^>]*>Xem ảnh nắn/);
    expect(actions('corners', true)).not.toMatch(/<button[^>]*disabled=""[^>]*>Xem ảnh nắn/);
  });

  it('TC-916: bước hỏi lại báo sẽ xoá vùng che và có nút Huỷ; bước xem trước có Dùng/Chỉnh lại/Huỷ', () => {
    const confirm = actions('confirm');
    expect(confirm).toContain('Nắn ảnh sẽ xoá vùng cắt và vùng che hiện có');
    expect(confirm).toContain('Vẫn dùng ảnh nắn');
    expect(confirm).toContain('Huỷ');
    const preview = actions('preview');
    for (const label of ['Dùng ảnh này', 'Chỉnh lại góc', 'Huỷ']) expect(preview).toContain(label);
  });

  it('nút trong trình che: chưa nắn thì "Nắn giấy", đã nắn thì "Dùng lại ảnh gốc"', () => {
    const tools = (scanned: boolean) =>
      renderToStaticMarkup(
        <ScanTools scanned={scanned} disabled={false} hasMasks={false} onScan={noop} onUnscan={noop} />,
      );
    expect(tools(false)).toContain('Nắn giấy');
    expect(tools(true)).toContain('Dùng lại ảnh gốc');
  });
});
