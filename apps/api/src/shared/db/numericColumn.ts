// Cột numeric của PostgreSQL đọc/ghi dạng chuỗi; null giữ nguyên null (không biến thành 0 hay "null").
export const toNumeric = (value: number | null) => (value === null ? null : String(value));
export const fromNumeric = (value: string | null) => (value === null ? null : Number(value));
