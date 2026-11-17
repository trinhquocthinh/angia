# Khung kiểm thử cô lập nhà

### E27-S1-T1 — Khung test cô lập nhà (2026-11-17)

Đã áp dụng khung test tại `apps/api/test/isolation/household.int.test.ts`,
dùng lại probe và fixture từ suite chéo gia đình hiện có. Hai suite chạy trên
PostgreSQL Testcontainers qua role app `NOBYPASSRLS`: **319 PASS, 17 TODO**.
TODO là route chưa triển khai, không được tính PASS. Không đổi middleware,
schema, dependency hoặc nghiệp vụ rời/gỡ nhà.

Quyết định owner: còn phiên nhưng chưa có nhà nhận `403 ERR_FORBIDDEN` tại cổng
route sức khỏe; hai route xem/xác nhận link liên kết hồ sơ giữ `404 ERR_NOT_FOUND`.
Đã vào nhà mới thì ID/token tài nguyên nhà cũ nhận `404 ERR_NOT_FOUND`.
Fixture đổi quyền bằng SQL owner trong container tạm rồi dùng lại cookie cũ;
chưa nghiệm thu API rời/gỡ E28. Snapshot DB được so trước/sau các request bị chặn.
Phép kiểm tra RLS xanh → tắt RLS thì assertion thất bại → bật lại thì xanh đã PASS
trên `health_profiles`; chưa phải bằng chứng trên bảng mới v1.0.

Kiểm chứng 2026-11-17:

- Integration hai suite: 319 PASS, 17 TODO.
- Typecheck toàn workspace, ESLint/Prettier phần thay đổi và `git diff --check` PASS.
- `yarn verify:fast` exit 1: typecheck PASS, unit vướng socket localhost trong sandbox
  và metadata macOS `._*`. Chạy lại unit ngoài sandbox, chỉ loại `**/._*`:
  649 suite / 3.360 test PASS; không gọi kết quả này là `verify:fast` PASS.
- `yarn verify` exit 1 sau generate API và typecheck: lint bắt metadata `._*`
  và code trong `.claude/worktrees`. Chưa chạy hết các bước sau lint; không sửa
  cấu hình kiểm tra hoặc dọn các thay đổi ngoài task.

**Chưa đóng T1 theo toàn bộ DoD; E27 chưa có task nghiệm thu từ checkpoint này.**
Khi E27-S2-T1 thêm bảng, phải thay cổng kiểm kê bảng chưa tồn tại bằng fixture,
probe RLS thật và bằng chứng phá thử trên ít nhất một bảng mới. Mỗi route mới
phải thay mục TODO bằng probe thực thi và ca thành công hợp lệ; không nhận 404
của router làm bằng chứng cô lập. Ba đường ngoài RLS thuộc E27-S1-T2.
Chưa nghiệm thu SIT/Production, push, PR hoặc deploy.

## Chạy lại

Từ thư mục gốc repo, với Colima đang chạy:

```sh
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
yarn vitest run --project int apps/api/test/isolation/household.int.test.ts apps/api/src/shared/test/crossFamilyIsolation.int.test.ts
yarn verify:fast
yarn verify
```

Nếu cần phân biệt lỗi metadata và hạn chế sandbox với lỗi unit, lượt kiểm tra
bổ sung đã dùng (không thay thế hai lệnh verify):

```sh
yarn vitest run --project 'unit*' --changed --exclude '**/._*'
```

Lượt bổ sung cần cho phép mở socket localhost. Không chạy SQL phá RLS trên DB
ứng dụng: suite tự tạo và hủy PostgreSQL Testcontainers, khôi phục RLS trong `finally`.
Test kiểm kê cố ý báo đỏ khi bảng/route trong `householdIsolationPlan.ts` xuất hiện
mà chưa được chuyển sang fixture/probe thực thi. Loại bỏ mục kế hoạch phải đi kèm
ca test thật, không chỉ xóa cổng kiểm kê hoặc thêm skip.

## Tài liệu liên quan

Bộ hồ sơ gốc nằm ngoài Git source tại `../../Docs/angia/` tính từ gốc repo:

- `04-sdd.md` §3.11, SPEC-066/067: quyết định mã phản hồi.
- `08-test-cases-specification.md`: TC-786/796/867/871/872.
- `11-master-plan.md`: trạng thái E27-S1-T1 và điều kiện DoD chưa đủ.
- `acceptance/v1.0/epic27-acceptance.md`: checkpoint và bằng chứng local.

Trong fixture, `POST /api/health-profiles/:id/manual-records` kỳ vọng `200` theo
hợp đồng hiện hành; không đổi API thành `201`.
