// Số tiền USD đúng đến cent: so sau khi nhân 100 để tránh sai số dấu phẩy động (1.1 * 100 = 110.00000000000001).
export const isWholeCents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
