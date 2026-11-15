// Ngân sách ứng viên: 1 tác vụ 64 MiB, tối đa 2 yêu cầu chờ; cần số đo SIT trước khi chốt runtime.
export const PASSWORD_HASH_LIMITS = { concurrency: 1, maxQueue: 2 } as const;
