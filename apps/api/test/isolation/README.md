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

## E27-S3-T2 — Probe lời mời và TC-868 (2026-11-17)

Hai route phát hành/thu hồi đã rời danh sách TODO trong `householdIsolationPlan.ts`:
ca hợp lệ, nhà khác, chưa có nhà, cookie cũ đã rời/chuyển nhà và rollback audit
nằm tại `features/household/presentation/householdInvitations.int.test.ts`.
Repository có test kiểm lại DB sau snapshot main đã bị hạ quyền/rời nhà/khoá.
`outsideRls.int.test.ts` đã thay TODO join_family bằng lời gọi hàm thật
`lookup_join_invitation(text)` cho hash token/mã, kiểm đúng bốn cột tối thiểu,
chặn hash/SELECT toàn bảng và các trạng thái không còn hiệu lực. Cùng assertion
quyền tối thiểu xanh → cấp SELECT thì thất bại → khôi phục lại xanh.
Phần found_family đã có ở T1; TC-868 cả hai loại đã kiểm chứng local.
TC-870 vẫn TODO cho E29, không tính PASS. TC-869 (E28-S2-T2) đã thành test thật:
`familyDeletionRole.int.test.ts` (hành vi role xoá nhà) và `familyDeletionPolicy.int.test.ts`
(chống lệch, grant tối thiểu, phá thử bỏ điều kiện đến hạn → đỏ → khôi phục → xanh).

Lệnh kiểm chứng từ gốc source với Colima:

```sh
yarn vitest run --project int apps/api/src/features/household apps/api/test/isolation/household.int.test.ts apps/api/test/isolation/outsideRls.int.test.ts
yarn vitest run --project int apps/api/src/shared/db/runMigrations.int.test.ts apps/api/src/shared/db/schema/householdPrivileges.int.test.ts
```

Kết quả T2: nhóm đầu 5 suite / 364 PASS, 16 TODO; nhóm sau 2 suite / 9 PASS.
Migration `0043_join_invitation_lookup` chạy trong PostgreSQL dùng một lần;
không áp dụng các phép phá thử quyền lên DB ứng dụng local/SIT.
Nếu máy có metadata macOS `._*`, lượt bổ sung dùng cấu hình Vitest tạm ngoài
repository: import cấu hình gốc, nối `**/._*` vào `test.exclude` của từng project
và truyền `--config` đến file tạm. CLI `--exclude` riêng vẫn có thể thu thập
metadata do cấu hình nhiều project. Lượt này không thay thế `yarn verify:fast`:
lệnh chính thức vẫn exit 1 do NUL trong metadata sau khi typecheck đạt.
TC-775–776 xác nhận lời mời đã chuyển sang T3 theo owner duyệt; test T2 không
nghiệm thu claim/membership, verifier đăng ký hoặc web nhận lời mời.

## E27-S3-T3 — Probe xác nhận và lập nhà (2026-11-17)

Hai route POST xác nhận/lập nhà đã rời HOUSEHOLD_ROUTE_PLAN và có probe thật;
route DELETE thu hồi lập nhà cũng có kiểm chứng creator/ID khác/ID không tồn tại.
Các route này không chứa dữ liệu sức khỏe; kiểm kê ở NON_HEALTH_DATA_ROUTES.
Không coi việc ra khỏi TODO là bằng chứng đã đóng DoD.

- `features/household/presentation/acceptHouseholdInvitation.int.test.ts`: TC-775–778,
  role/membership, mã, không liên kết hồ sơ, token sai/hết hạn/đã dùng/thu hồi,
  tranh token, một account nhận hai lời mời, pending deletion và rollback audit.
- `features/household/presentation/invitationConcurrency.int.test.ts`: kiểm lại
  hạn/thu hồi/pending deletion sau khi chờ family lock; xác nhận so với thu hồi.
- `features/household/presentation/foundingInvitations.int.test.ts`: admin OIDC,
  chặn main/local admin, lập nhà bằng mã và thu hồi chỉ bởi creator.
- `features/household/infrastructure/foundingInvitationAccess.int.test.ts`: quyền
  hàm 0044, search_path, không EXECUTE PUBLIC/SELECT hash, rollback audit.
- `features/account/infrastructure/registrationInvitations.int.test.ts`: verifier
  thật, join claim cùng account/credential/legal; founding giữ pending tới tạo
  nhà; API admin → đăng ký → lập nhà; tranh token và rollback pháp lý/audit.

Đường tra hash dùng hàm đặc quyền; ghi join vẫn dùng withFamilyScope từ bí mật
đã tra được, khoá account → family → invitation, kiểm lại sau chờ. Không mở quyền
đọc hash để triển khai xác nhận. TC-868 thật và phép nới SELECT ở outsideRls giữ
nguyên. TC-869/870 và các route của task sau vẫn TODO, không tính PASS.

Hồi quy nhà/isolation: 11 suite / 401 PASS, 14 TODO. Account/pháp lý: 12 suite /
97 PASS. Migration/quyền/snapshot/đăng ký bổ sung: 4 suite / 20 PASS; có test trùng
nên không cộng tổng. Chưa migrate DB ứng dụng local/SIT hoặc đóng toàn bộ DoD.
Hướng dẫn tạo cấu hình tạm loại metadata ở từng project và lệnh chạy lại tại
[runbook T3](../../../../../../Docs/angia/10-setup-and-ops-guide.md#e27-s3-t3--lời-mời-và-migration-0044-2026-11-17).
Từ gốc source, bảng suite này có tiền tố `apps/api/src/`; giữ các lệnh chạy
Testcontainers ở phần T2 phía trên. Kết quả và giới hạn hiện tại theo T3;
không gọi lượt bổ sung là verify:fast PASS.

## E29-S3-T2 — Probe tải dữ liệu về (2026-11-22)

Ba route `/api/me/data-exports` đã rời HOUSEHOLD_ROUTE_PLAN và có probe thật trong
`createHealthDataProbes`. Theo SPEC-072 (owner duyệt 2026-11-22) route không cần thuộc nhà,
nên TC-871/872 chờ `404 ERR_NOT_FOUND` (yêu cầu/tệp của nhà cũ không lộ, cùng body với ID
không tồn tại) thay vì `403`; `data_exports` nằm trong snapshot để chứng minh không ghi dòng.
