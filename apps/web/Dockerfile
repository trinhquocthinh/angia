# syntax=docker/dockerfile:1
# Build context: gốc repo — docker build -f apps/web/Dockerfile .
ARG NODE_IMAGE=node:22-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6

# ---------------------------------------------------------------------------
# Stage 1: build SPA tĩnh bằng Vite
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
RUN yarn workspaces focus @angia/web

COPY tsconfig.base.json ./
COPY apps/web apps/web
RUN yarn workspace @angia/web build

# ---------------------------------------------------------------------------
# Stage 2: nginx không đặc quyền phục vụ file tĩnh (API do Caddy định tuyến riêng)
# ---------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime
LABEL org.opencontainers.image.source=https://github.com/trinhquocthinh/angia
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER 10001:0
EXPOSE 8080
