import { expect, it } from 'vitest';
import { householdErrorMessage } from './householdErrorMessage';

it('TC-769: đăng ký đóng yêu cầu lời mời, không nói nhà đã được tạo', () => {
  expect(householdErrorMessage('ERR_REGISTRATION_CLOSED')).toBe(
    'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.',
  );
});
it('TC-767: mã lạ không được đưa chẩn đoán nội bộ lên giao diện', () => {
  expect(householdErrorMessage('SQL private failure')).toBe('Không thể tạo nhà. Vui lòng thử lại.');
});
