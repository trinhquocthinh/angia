# Nguồn gốc mô hình cơ thể `body.glb`

Bản công khai rút gọn. Hồ sơ đầy đủ (ảnh chụp, biên lai, toàn văn điều khoản) giữ riêng tư trong bộ tài liệu dự án, `Docs/angia/model3D/PROVENANCE.md`; không commit vì có thông tin tài khoản.

## Mô hình gốc (E18-S1-T1)

- Dịch vụ: Tripo Studio (https://studio.tripo3d.ai/), Tripo H3.1, Text to Model. Đầu vào chỉ là văn bản, không dùng ảnh người thật.
- Ngày sinh mô hình: 2026-11-05. Mã mô hình: `6ecf507d-3643-4821-91cf-c1f5a4b8cb95` (tên node trong Studio: `tripo_node_87bf5ad2-55f5-4208-aa1c-e1ef97dc8033`).
- Gói: Starter trả phí, có "Private Models · Commercial Use".
- Quyền sử dụng: Terms of User Agreement bản cập nhật July 11, 2025. §5.2.2: người dùng trả phí có toàn quyền với Outputs (dùng, sửa, phân phối, cấp phép). §3.2: được dùng Outputs cho mục đích thương mại hợp pháp.
- Kiểm duyệt: Tripo gắn cờ, chủ dự án khiếu nại; 2026-11-06 Tripo chấp thuận và khôi phục mô hình.
- GLB gốc: 459 556 byte, 19 098 tam giác, SHA-256 `bf23eb3fa18dac0d93f9679d79f0c1a220ace7830dda464f7e2d77925a36fa99`.

Prompt:

```text
A single full-body gender-neutral stylized human mannequin for a family
health journal. Smooth simplified proportions, upright symmetrical A-pose,
arms slightly away from the torso, legs slightly apart, hands separated
from thighs, both feet flat. Featureless face, no hair, no clothing or
accessories, no visible genitalia, nipples, or detailed anatomy.
Uniform matte warm-gray surface, no skin texture, no realistic skin.
One complete body, suitable for viewing from front, back, and both sides.
```

## Chỉnh sửa

1. **E18-S1-T2** (Blender 5.2.3): đối xứng trục X, giảm còn 8 000 tam giác, một vật liệu `body_fill` `#ECE8E2` (`color.body.fill`), không texture/UV.
2. **E18-S1-T3** (Blender 5.2.3 + `@gltf-transform/cli` 4.5.1): thêm 35 mesh vùng vô hình `region__<code>__<side>` theo `bodyRegions` (SPEC-051), vật liệu `region` alpha 0; nén `EXT_meshopt_compression` + `KHR_mesh_quantization`.
3. **E22-S3-T1** (cùng công cụ): nới vùng khuỷu tay từ t 0,40–0,50 lên 0,38–0,52 trên trục vai → đầu ngón (SPEC-058); dựng lại từ `body-t2.glb`, mỗi khuỷu 233 → 277 mặt.

Script tái lập nằm trong tài liệu dự án (`model3D/scripts/t2_prepare.py`, `t3_regions.py`); số đo ở `plans/2026-11-06-bodywell-3d-spike.md`.

## Tệp

| Tệp        | Byte    | SHA-256                                                            |
| ---------- | ------- | ------------------------------------------------------------------ |
| `body.glb` | 213 628 | `34f54e0744c8bf6a82f7206520489f08fd440eb1c98b9b3f27bc58747b7079df` |

Trục: Y lên (glTF), người nhìn +Z, bên trái người = +X. Node: `body` (hiển thị), `regions` (cha của 35 node vùng).
