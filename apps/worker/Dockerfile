# syntax=docker/dockerfile:1
# Build context: gốc repo — docker build -f apps/worker/Dockerfile .
ARG NODE_IMAGE=node:22-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d

# ---------------------------------------------------------------------------
# Stage 1: cài dependencies và biên dịch TypeScript (tsc + tsc-alias)
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
# Compile cache của Node (Corepack bật) ghi file không tất định → phá tính tái lập digest.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NODE_DISABLE_COMPILE_CACHE=1
WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/contracts/package.json packages/contracts/
COPY packages/web-push/package.json packages/web-push/
RUN yarn workspaces focus @angia/worker

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY packages/web-push packages/web-push
COPY apps/worker apps/worker
RUN yarn workspace @angia/contracts build && yarn workspace @angia/web-push build && yarn workspace @angia/worker build

# ---------------------------------------------------------------------------
# Stage 2: runtime chỉ chứa dependencies production + mã đã biên dịch
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
LABEL org.opencontainers.image.source=https://github.com/trinhquocthinh/angia
ENV NODE_ENV=production COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NODE_DISABLE_COMPILE_CACHE=1
WORKDIR /app

# useradd ghi ngày tạo vào /etc/shadow; dùng mốc commit để digest không đổi theo ngày build.
ARG SOURCE_DATE_EPOCH
RUN corepack enable \
  && groupadd --gid 10001 angia \
  && useradd --uid 10001 --gid angia --no-create-home --shell /usr/sbin/nologin angia

COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/contracts/package.json packages/contracts/
COPY packages/web-push/package.json packages/web-push/
# sharp tải binary libvips theo nền tảng build (linux glibc) qua optionalDependencies.
RUN yarn workspaces focus @angia/worker --production && yarn cache clean --all && rm -rf /root/.cache

COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/web-push/dist packages/web-push/dist
COPY --from=build /app/apps/worker/dist apps/worker/dist

USER 10001:10001
# Không mở cổng: worker chỉ kết nối ra PostgreSQL, Garage S3, OpenRouter và push service của trình duyệt
# (HTTPS ra ngoài tới endpoint Web Push — E9-S2-T2 send-reminders).
CMD ["node", "apps/worker/dist/worker.js"]
