-- Chuẩn hóa cấu hình hiện tại theo quy ước ngân sách 1:1.
-- Không phải thao tác Admin: giữ version/actor/thời điểm, giữ nguyên audit và lịch sử tiền.
-- Client cũ gửi usdPerCredit bị hợp đồng API mới từ chối; triển khai đồng bộ API/web/worker.
UPDATE "ai_routing_settings"
SET "settings" = "settings" #- '{woku,usdPerCredit}'
WHERE ("settings" -> 'woku') ? 'usdPerCredit';
