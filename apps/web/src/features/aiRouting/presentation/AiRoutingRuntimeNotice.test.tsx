import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AiRoutingRuntimeNotice } from './AiRoutingRuntimeNotice';

it('TC-532: giải thích hiệu lực lượt tiếp theo và giới hạn Woku, không suy đoán mode đang chạy', () => {
  const markup = renderToStaticMarkup(<AiRoutingRuntimeNotice />);
  expect(markup).toContain('lượt xử lý tiếp theo');
  expect(markup).toContain('Chế độ giả lập không gọi dịch vụ thật');
  expect(markup).toContain('Woku thật chưa được bật');
  expect(markup).not.toContain('chưa đổi dịch vụ nhận diện đang chạy');
});
