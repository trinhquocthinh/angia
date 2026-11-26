import { describe, expect, it } from 'vitest';
import { loadReminderSeedOptions } from './loadReminderSeedOptions.js';

const env = { DATABASE_URL: 'postgres://angia_dev_app:secret@localhost:5433/angia_dev' };

describe('Seed UI nhắc thuốc chỉ dùng cơ sở dữ liệu dev và tài khoản chỉ định', () => {
  it('nhận hai tài khoản yêu cầu, gộp tên trùng và không làm lộ mật khẩu', () => {
    expect(loadReminderSeedOptions(env, ['tester1', 'tester', 'tester1']).usernames).toEqual([
      'tester1',
      'tester',
    ]);
  });
  it.each([
    { DATABASE_URL: 'postgres://angia_prod_app:secret@localhost/angia_prod' },
    { DATABASE_URL: 'postgres://angia_dev_owner:secret@localhost/angia_dev' },
    { ...env, NODE_ENV: 'production' },
    {},
  ])('từ chối môi trường không đúng trước khi kết nối', (values) => {
    expect(() => loadReminderSeedOptions(values, ['tester'])).toThrow(
      'Seed chỉ chạy với angia_dev_app trên angia_dev.',
    );
  });
  it('không tự chọn mọi gia đình khi thiếu tên đăng nhập', () => {
    expect(() => loadReminderSeedOptions(env, [])).toThrow('Cần tên đăng nhập tài khoản main.');
  });
});
