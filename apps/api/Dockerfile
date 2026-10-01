# syntax=docker/dockerfile:1
# Build context: gốc repo — docker build -f apps/api/Dockerfile .
ARG NODE_IMAGE=node:22-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c

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
RUN yarn workspaces focus @angia/api

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN yarn workspace @angia/contracts build && yarn workspace @angia/api build

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
RUN yarn workspaces focus @angia/api --production && yarn cache clean --all && rm -rf /root/.cache

COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/apps/api/dist apps/api/dist

USER 10001:10001
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
