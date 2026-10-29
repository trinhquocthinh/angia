import type { ProfileSession } from '../../application/ports';

// Nhãn vai trò trên menu tài khoản theo thiết kế header.
export function roleLabel(role: ProfileSession['role']) {
  return role === 'main' ? 'Quản trị gia đình' : 'Thành viên';
}
