import { describe, expect, it } from 'vitest';
import { filterByName } from './filterByName';

const people = [{ name: 'Nhà Thịnh' }, { name: 'Bà Ngoại' }, { name: 'Đức Anh' }, { name: 'Toni' }];
const names = (query: string, limit?: number) =>
  filterByName(people, query, (item) => item.name, limit).map((item) => item.name);

describe('Lọc theo tên cho ô tìm kiếm header', () => {
  it('bỏ qua dấu tiếng Việt và hoa thường', () => {
    expect(names('thinh')).toEqual(['Nhà Thịnh']);
    expect(names('NGOAI')).toEqual(['Bà Ngoại']);
  });
  it('coi "đ" tương đương "d"', () => {
    expect(names('duc')).toEqual(['Đức Anh']);
    expect(names('đức')).toEqual(['Đức Anh']);
  });
  it('chuỗi rỗng hoặc chỉ khoảng trắng không trả kết quả', () => {
    expect(names('')).toEqual([]);
    expect(names('   ')).toEqual([]);
  });
  it('giới hạn số kết quả', () => {
    expect(names('a', 2)).toHaveLength(2);
  });
});
