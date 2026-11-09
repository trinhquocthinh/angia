import type { BodyRegion } from '@angia/contracts';

// Tọa độ trong khung 320 × 616: điểm trên hình, tâm nút chạm.
// Nút giữ kích thước CSS 44 px khi khung thu lại; đường chỉ dẫn nối về vùng thật.
export const bodyMapLayout = {
  head: [160, 44, 160, 30],
  neck: [160, 92, 160, 82],
  chest: [160, 138, 160, 134],
  abdomen: [160, 201, 160, 186],
  upper_back: [160, 138, 160, 134],
  lower_back: [160, 201, 160, 186],
  pelvis: [160, 252, 160, 238],
  shoulder: [112, 121, 24, 112],
  upper_arm: [101, 166, 24, 164],
  elbow: [93, 202, 24, 216],
  forearm: [82, 245, 24, 268],
  wrist: [71, 285, 24, 320],
  hand: [65, 316, 24, 372],
  hip: [120, 250, 84, 224],
  buttock: [143, 256, 128, 276],
  thigh: [138, 334, 128, 340],
  knee: [137, 402, 128, 404],
  shin: [136, 458, 128, 464],
  calf: [136, 458, 128, 464],
  ankle: [137, 515, 128, 528],
  foot: [134, 544, 128, 580],
} as const satisfies Record<BodyRegion, readonly [number, number, number, number]>;
