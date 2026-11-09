export type BodySide = 'left' | 'right' | 'center';

export const bodyRegions = {
  head: { label: 'Đầu', sides: ['center'] },
  neck: { label: 'Cổ', sides: ['center'] },
  chest: { label: 'Ngực', sides: ['center'] },
  abdomen: { label: 'Bụng', sides: ['center'] },
  upper_back: { label: 'Lưng trên', sides: ['center'] },
  lower_back: { label: 'Thắt lưng', sides: ['center'] },
  pelvis: { label: 'Vùng chậu', sides: ['center'] },
  shoulder: { label: 'Vai', sides: ['left', 'right'] },
  upper_arm: { label: 'Cánh tay', sides: ['left', 'right'] },
  elbow: { label: 'Khuỷu tay', sides: ['left', 'right'] },
  forearm: { label: 'Cẳng tay', sides: ['left', 'right'] },
  wrist: { label: 'Cổ tay', sides: ['left', 'right'] },
  hand: { label: 'Bàn tay, ngón tay', sides: ['left', 'right'] },
  hip: { label: 'Hông', sides: ['left', 'right'] },
  buttock: { label: 'Mông', sides: ['left', 'right'] },
  thigh: { label: 'Đùi', sides: ['left', 'right'] },
  knee: { label: 'Đầu gối', sides: ['left', 'right'] },
  shin: { label: 'Cẳng chân (trước)', sides: ['left', 'right'] },
  calf: { label: 'Bắp chân', sides: ['left', 'right'] },
  ankle: { label: 'Cổ chân', sides: ['left', 'right'] },
  foot: { label: 'Bàn chân, ngón chân', sides: ['left', 'right'] },
} as const satisfies Record<string, { label: string; sides: readonly BodySide[] }>;

export type BodyRegion = keyof typeof bodyRegions;
