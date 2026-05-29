# 用于多平台 Docker 构建
# 使用 docker/buildx 的默认 Dockerfile
# 基于 Alpine Linux，支持 ARM64 和 AMD64

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  git

# 复制 package 文件
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 安装后端依赖
WORKDIR /app/backend
RUN npm ci

# 安装前端依赖
WORKDIR /app/frontend
RUN npm ci

# 复制源代码
COPY backend /app/backend
COPY frontend /app/frontend

# 构建前端
WORKDIR /app/frontend
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 安装 HandBrake 和运行时依赖
RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    echo "https://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk add --no-cache \
    handbrake \
    ffmpeg \
    tzdata \
    dumb-init \
    libva \
    libva-intel-driver \
    mesa-va-gallium \
    mesa-dri-gallium \
    mesa-gl \
    libx264 \
    libx265 \
    libvpx \
    libdav1d \
    aom-libs

# 设置时区
ENV TZ=Asia/Shanghai

# 复制构建产物
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/src ./backend/src
COPY --from=builder /app/backend/server.js ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

# 安装后端生产依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=52389
ENV UPLOAD_DIR=/source
ENV OUTPUT_DIR=/output
ENV CONFIG_DIR=/config

# 创建必要目录
RUN mkdir -p /config /source /output

# 暴露端口
EXPOSE 52389

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# 启动命令
CMD ["node", "/app/backend/server.js"]

# 标签信息
LABEL maintainer="HandBrake Web UI Team"
LABEL description="HandBrake Web UI - Web-based video transcoding management"
LABEL org.opencontainers.image.source="https://github.com/your-username/handbrake-webui"
LABEL org.opencontainers.image.licenses="MIT"
