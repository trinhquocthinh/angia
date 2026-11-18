import { expect, it } from 'vitest';
import { assessPasswordStrength } from './assessPasswordStrength';

it.each([
  ['', 0, 'Chưa nhập'],
  ['abc', 1, 'Yếu'],
  ['aB1!', 1, 'Yếu'],
  ['abcdefgh', 1, 'Yếu'],
  ['abcd1234', 2, 'Trung bình'],
  ['Abcd1234', 3, 'Khá'],
  ['Abcd123!', 4, 'Rất mạnh'],
])('đánh giá độ mạnh %j theo mẫu, không kiểm tra quyền đăng ký', (value, score, label) => {
  expect(assessPasswordStrength(value)).toEqual({ score, label });
});
